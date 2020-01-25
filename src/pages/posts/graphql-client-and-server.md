---
title: Creating a GraphQL Client and Server
subtitle: Using gqlgen, react, apollo-client, and material-ui
date: '2020-01-25'
thumb_img_path: images/graphql-client-and-server.png
content_img_path: images/graphql-client-and-server.png
excerpt: >-
  Using go for the backend and typescript + react for the frontend we create a note
  taking application.
template: post
---

While REST was introduced in 2000 and is very mature, GraphQL was released in 2015 and brings some interesting new concepts. It has several advantages over REST:

- You can combine multiple API calls into a single request
- Only data the client really needs is fetched
- It supports subscriptions over WebSocket
- Type safety for both client and server

There are also some downsides:

- Mutations and queries don't support files directly
- Optimizing (nested) queries is hard as the schema complexity increases
- Too much boilerplate if you don't generate code

In my opinion, GraphQL is not suited for such simple examples, but it becomes more viable as more resolvers are added.

## Prerequisites

Make sure you have a working installation of [Go](https://golang.org/doc/install) and [Node](https://nodejs.org/en/download/).

## Server

Let's get started by creating the server.

```bash
mkdir server
cd server
go mod init github.com/lukas-tr/server
```

Next, we're using `gqlgen` to generate the necessary boilerplate for setting up our note taking API.

```bash
go run github.com/99designs/gqlgen init
```

The directory structure should now look like this:

```text
.
├── generated.go
├── go.mod
├── go.sum
├── gqlgen.yml
├── models_gen.go
├── resolver.go
├── schema.graphql
└── server
    └── server.go
```

Let's edit `schema.graphql` next. Our schema contains 3 operations: Creating a new note, querying all notes and subscribing to changes.

```graphql
type Note {
  id: ID!
  text: String!
}

type Mutation {
  createNote(text: String!): Note!
}

type Query {
  notes: [Note!]!
}

type Subscription {
  noteCreated: Note!
}
```

Afterwards, we need to regenerate `models_gen.go` (containing the `Note` model), `generated.go` (containing the handler) and `resolver.go` (containing resolvers).

```bash
rm resolver.go
go run github.com/99designs/gqlgen
```

We can now implement our resolvers in `resolver.go`:

```go
package server

import (
	"context"
	"sync"

	"github.com/google/uuid"
)

type Resolver struct {
	mutex                  sync.RWMutex
	noteCreatedSubscribers map[string]chan *Note
	notes                  []*Note
}

func NewResolver() *Resolver {
	return &Resolver{
		noteCreatedSubscribers: make(map[string]chan *Note),
	}
}

func (r *Resolver) Mutation() MutationResolver {
	return &mutationResolver{r}
}
func (r *Resolver) Query() QueryResolver {
	return &queryResolver{r}
}
func (r *Resolver) Subscription() SubscriptionResolver {
	return &subscriptionResolver{r}
}

type mutationResolver struct{ *Resolver }

// CreateNote adds a note and notifies subscribers of new notes
func (r *mutationResolver) CreateNote(ctx context.Context, text string) (*Note, error) {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	id, err := uuid.NewRandom()
	if err != nil {
		return nil, err
	}
	note := &Note{ID: id.String(), Text: text}
	r.notes = append(r.notes, note)
	for _, subscriber := range r.noteCreatedSubscribers {
		subscriber <- note
	}
	return note, nil
}

type queryResolver struct{ *Resolver }

// Notes lists all notes
func (r *queryResolver) Notes(ctx context.Context) ([]*Note, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()
	return r.notes, nil
}

type subscriptionResolver struct{ *Resolver }

// NoteCreated subscribes to note creations
func (r *subscriptionResolver) NoteCreated(ctx context.Context) (<-chan *Note, error) {
	r.mutex.Lock()
	defer r.mutex.Unlock()
	noteChan := make(chan *Note, 1)
	id, err := uuid.NewRandom()
	if err != nil {
		return nil, err
	}
	r.noteCreatedSubscribers[id.String()] = noteChan
	// delete the subscription when the client disconnects
	go func() {
		<-ctx.Done()
		r.mutex.Lock()
		defer r.mutex.Unlock()
		delete(r.noteCreatedSubscribers, id.String())
	}()
	return noteChan, nil
}
```

Now update `server/server.go` to make use of `server.NewResolver`:

```diff
- http.Handle("/query", handler.GraphQL(server.NewExecutableSchema(server.Config{Resolvers: &server.Resolver{}})))
+ http.Handle("/query", handler.GraphQL(server.NewExecutableSchema(server.Config{Resolvers: server.NewResolver()})))
```

The server is now ready. You can start it and open the GraphQL playground in your browser.

```bash
go run server/server.go &
xdg-open http://localhost:8080/
```

![](/images/graphql-playground-schema.png)

The playground supports code completion and shows documentation for our schema.

## Client

We're using create-react-app to generate the client.

```bash
cd ..
npx create-react-app client --template typescript
cd client
npm i --save-dev @graphql-codegen/cli @graphql-codegen/introspection @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo
npm i --save apollo-boost @apollo/react-hooks graphql @material-ui/core
```

We can now add a script to `package.json` which will generate hooks based on our client schema. While starting the app in development mode, we also need to proxy requests to our server.

```diff
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
-   "eject": "react-scripts eject"
+   "eject": "react-scripts eject",
+   "generate": "graphql-codegen --config codegen.js"
  },
+ "proxy": "http://localhost:8080",
```

Let's configure graphql-codegen by adding `codegen.js`:

```js
module.exports = {
  schema: "http://localhost:8080/query",
  documents: ["./src/**/*.graphql"],
  generates: {
    "./src/graphql.tsx": {
      plugins: [
        "typescript",
        "typescript-operations",
        "typescript-react-apollo"
      ],
      config: {
        skipTypename: false,
        withHooks: true,
        withHOC: false,
        withComponent: false
      }
    }
  }
};
```

Now add `src/schema.graphql`:

```graphql
mutation CreateNote($text: String!) {
  createNote(text: $text) {
    id
    text
  }
}
query GetNotes {
  notes {
    id
    text
  }
}
subscription NewNotes {
  noteCreated {
    id
  }
}
```

Make sure the server we created earlier is running and run the script we defined earlier. This will take our schema and generate react hooks.

```bash
npm run generate
```

The directory structure should now look like this:

```text
.
├── codegen.js // highlight-line
├── package.json
├── package-lock.json
├── public
│   ├── favicon.ico
│   ├── index.html
│   ├── logo192.png
│   ├── logo512.png
│   ├── manifest.json
│   └── robots.txt
├── README.md
├── src
│   ├── App.css
│   ├── App.test.tsx
│   ├── App.tsx
│   ├── graphql.tsx // highlight-line
│   ├── index.css
│   ├── index.tsx
│   ├── logo.svg
│   ├── react-app-env.d.ts
│   ├── schema.graphql // highlight-line
│   ├── serviceWorker.ts
│   └── setupTests.ts
└── tsconfig.json
```

Before we can use the hooks, we need to configure the apollo client in `src/index.tsx`.

```tsx
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import ApolloClient from "apollo-boost";
import { ApolloProvider } from '@apollo/react-hooks';

const client = new ApolloClient({
  uri: "/query"
});

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById("root")
);
```

Finally, we can make use of our hooks in `src/App.tsx`:

```tsx
import React from "react";
import { useCreateNoteMutation, useGetNotesQuery, GetNotesDocument, GetNotesQueryVariables, GetNotesQuery } from "./graphql";
import { Button, TextField, List, ListItem, ListItemText } from "@material-ui/core";

const App: React.FC = () => {
  const [text, setText] = React.useState("");
  const { data } = useGetNotesQuery();
  const [createNote] = useCreateNoteMutation({
    update(cache, { data }) {
      const cachedData = cache.readQuery<GetNotesQuery, GetNotesQueryVariables>(
        { query: GetNotesDocument }
      );
      cache.writeQuery({
        query: GetNotesDocument,
        data: { notes: cachedData!.notes.concat([data!.createNote]) }
      });
    }
  });

  return (
    <div>
      <TextField
        label="Note Text"
        value={text}
        onChange={event => setText(event.target.value)}
      />
      <Button
        variant="contained"
        color="primary"
        onClick={() => createNote({ variables: { text } })}
      >
        Create Note
      </Button>
      <List>
        {data?.notes.map(note => (
          <ListItem key={note.id}>
            <ListItemText>{note.text}</ListItemText>
          </ListItem>
        ))}
      </List>
    </div>
  );
};

export default App;
```

That's it. You can now start the app and add some notes.

```bash
npm start
```

![](/images/graphql-client-notes.png)

We can also use the integrated graphql playground to subscribe to changes.
In case you want to use subscriptions on the client instead, you have to use [apollo-client](https://www.apollographql.com/docs/react/migrating/boost-migration/) to create the client yourself since subscriptions aren't supported by apollo-boost out of the box.

![](/images/graphql-playground-subscription.png)

## Further Reading

- https://gqlgen.com/
- https://www.apollographql.com/docs/react/get-started/
- https://create-react-app.dev/
