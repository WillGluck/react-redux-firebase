import React, { PropTypes, Component } from 'react'
import { connect } from 'react-redux'
import { map } from 'lodash'
import classes from './Home.scss'
import Theme from 'theme'

import TodoItem from '../TodoItem'
import NewTodoPanel from '../NewTodoPanel'
import CircularProgress from 'material-ui/CircularProgress'
import Snackbar from 'material-ui/Snackbar'
import { List } from 'material-ui/List'
import Paper from 'material-ui/Paper'
import Subheader from 'material-ui/Subheader'

import { firebaseConnect, helpers } from 'react-redux-firebase'
const { isLoaded, pathToJS, dataToJS, populatedDataToJS } = helpers
// used for populating
// const populates = [{ child: 'owner', root: 'users', keyProp: 'key' }]

@firebaseConnect([
  // 'todos' // sync list of todos
  { path: 'todos', queryParams: ['limitToFirst=20'] } // limit to first 20
  // { path: 'todos', queryParams: ['limitToFirst=20'], populates } // populate
  // { path: '/projects', type: 'once' } // for loading once instead of binding
  // { path: 'todos', queryParams: ['orderByChild=text'] }, // list only not done todos
])
@connect(
  ({firebase}) => ({
    todos: dataToJS(firebase, 'todos'),
    // todos: populatedDataToJS(firebase, '/todos', populates), // if populating
    // todos: orderedToJS(firebase, 'todos'), // if using ordering such as orderByChild
    auth: pathToJS(firebase, 'auth')
  })
)
export default class Home extends Component {
  static propTypes = {
    todos: PropTypes.oneOfType([
      PropTypes.object, // object if using dataToJS
      PropTypes.array // array if using orderedToJS
    ]),
    firebase: PropTypes.shape({
      set: PropTypes.func.isRequired,
      remove: PropTypes.func.isRequired,
      push: PropTypes.func.isRequired
    }),
    auth: PropTypes.shape({
      uid: PropTypes.string
    })
  }

  state = {
    error: null
  }

  toggleDone = (todo, id) => {
    const { firebase, auth } = this.props
    if (!auth || !auth.uid) {
      return this.setState({ error: 'You must be Logged into Toggle Done' })
    }
    firebase.set(`/todos/${id}/done`, !todo.done)
  }

  deleteTodo = (id) => {
    const { todos, auth, firebase } = this.props
    if (!auth || !auth.uid) {
      return this.setState({ error: 'You must be Logged into Delete' })
    }
    if (todos[id].owner !== auth.uid) {
      return this.setState({ error: 'You must own todo to delete' })
    }
    firebase.remove(`/todos/${id}`)
  }

  handleAdd = (newTodo) => {
    // Attach user if logged in
    if (this.props.auth) {
      newTodo.owner = this.props.auth.uid
    } else {
      newTodo.owner = 'Anonymous'
    }
    this.props.firebase.push('/todos', newTodo)
  }

  render () {
    const { todos } = this.props
    const { error } = this.state

    return (
      <div className={classes.container} style={{ color: Theme.palette.primary2Color }}>
        {
          error
            ? <Snackbar
              open={!!error}
              message={error}
              autoHideDuration={4000}
              onRequestClose={() => this.setState({ error: null })}
              />
            : null
        }
        <div className={classes.info}>
          from
          <span className='Home-Url'>
            <a href='https://redux-firebasev3.firebaseio.com/'>
              redux-firebasev3.firebaseio.com
            </a>
          </span>
        </div>
        <div className={classes.todos}>
          <NewTodoPanel
            onNewClick={this.handleAdd}
            disabled={false}
          />
          {
            !isLoaded(todos)
              ? <CircularProgress />
              : <Paper className={classes.paper}>
                <Subheader>Todos</Subheader>
                <List className={classes.list}>
                  {
                        todos &&
                          map(todos, (todo, id) => (
                            <TodoItem
                              key={id}
                              id={id}
                              todo={todo}
                              onCompleteClick={this.toggleDone}
                              onDeleteClick={this.deleteTodo}
                            />
                          )
                        )
                      }
                </List>
              </Paper>
          }
        </div>
      </div>
    )
  }
}
