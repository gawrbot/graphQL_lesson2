import { ApolloServer, gql, makeExecutableSchema } from 'apollo-server-micro';

require('dotenv').config();
const postgres = require('postgres');
const sql = postgres();

const typeDefs = gql`
  type Query {
    users: [User!]!
    user(username: String): User
    todos(checked: Boolean): [Todo]
    todo(id: ID!): Todo
  }
  type Mutation {
    createTodo(title: String!): Todo
  }
  type User {
    name: String
    username: String
  }
  type Todo {
    id: ID!
    title: String
    checked: Boolean
  }
`;
// fake DataSource (living in memory only)
const users = [
  { name: 'Leeroy Jenkins', username: 'leeroy' },
  { name: 'Foo Bar', username: 'foobar' },
];

async function getTodos() {
  return await sql`select * from todos`;
}

async function createTodo(title) {
  const result = await sql`INSERT INTO todos (title, checked)
  VALUES (${title}, ${false}) RETURNING id, title;`;
  console.log(result);
  return result[0];
}

const resolvers = {
  Query: {
    users() {
      return users;
    },
    user(parent, { username }) {
      return users.find((user) => user.username === username);
    },
    todos(parent, { checked }) {
      if (checked === undefined) {
        return getTodos();
      }

      if (checked === false) {
        return getTodos().filter((todo) => !todo.checked);
      } else {
        return getTodos().filter((todo) => todo.checked);
      }
    },
    todo(parent, { id }) {
      return getTodos().find((todo) => todo.id === parseInt(id));
    },
  },
  Mutation: {
    createTodo: (parent, args) => {
      return createTodo(args.title);
    },
  },
};

export const schema = makeExecutableSchema({ typeDefs, resolvers });

export const config = {
  api: {
    bodyParser: false,
  },
};

export default new ApolloServer({ schema }).createHandler({
  path: '/api/graphql',
});
