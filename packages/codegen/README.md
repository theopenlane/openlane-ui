# GraphQL code generator

[@graphql-codegen](https://the-guild.dev/graphql/codegen) is what generated
everything in this directory, using the configuration `graphql-codegen.yml`.

## Generating

When interacting with the Openlane `core` api, most of the requests will
interact with the [GraphQL API](https://api.theopenlane.io/query). In order to
make this process easier, we use codegen to create the `urql` functions to be
used within the components.

1. Add a new query or mutation to `/query`. Queries should be added to a file
   relevant to the the object(s) being used. For example, a new organization
   query should be added to a file called `organization.graphql`
1. For help creating the correct graphql query, we recommend using the
   [Apollo Graphql Explorer](https://studio.apollographql.com/sandbox/explorer)
1. Run the task command to generate. This will run the `generate` command as
   well as a `clean` command which does some necessary cleanup on the generated
   files.
   ```
   task codegen:codegen
   ```

## Usage

1. Include import:
   ```tsx
   import { useUpdateUserNameMutation } from "@repo/codegen/src/schema";
   ```
1. Call function from generated file, using the `useUpdateUserNameMutation` for
   this example:
   ```tsx
   // setup mutation function
   const [{ fetching: isSubmitting }, updateUserName] =
       useUpdateUserNameMutation();

   // add form to collect input

   // call update with data from form
   const updateName = async ({
       firstName,
       lastName,
   }: {
       firstName: string;
       lastName: string;
   }) => {
       await updateUserName({
           updateUserId: userId,
           input: {
               firstName: firstName,
               lastName: lastName,
           },
       });
       setIsSuccess(true);
   };
   ```
