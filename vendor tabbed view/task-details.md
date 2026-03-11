This should be done with feat-crud-base-config
this will use the

- Tabbed View/Edit
- Step Dialog Create
  Anything with
  campaign
  should be left off until campaign work is completed.
  Tabs:
- Overview
- Documents
  - Upload documents such as soc2 report, contract, invoice, etc
  - Marking as evidence should auto create an evidence object with the file attached
- Campaigns (hidden until campaign work is done but we can show it for now)
- Contract
- Contacts
  - default to card view; but make the toggle sticky
- Risk Review

development hints:

1. currently when we open /registry/vendors we have table set correctly
2. when we click on create we open a sheet. we need to replace this with create vendor dialog with 3 steps shown in the images
3. when we click on the row we open a sheet also /registry/vendors?id=01KJ0JV136W2NVFPRAXNG6PGGJ. we need to replace this with entirely new page like we have on controls. this page should open /registry/vendors/01KJ0JV136W2NVFPRAXNG6PGGJ. this new page should render content from "overview + sidebar.png"
4. all tabs use same layout tab + sidebar while overview whould be the default one. whenever we change tab we need to change it by changing url ?tab="tabname"
5. for sidebar setup, you have example in controls/id page
6. as you can see in "overview + sidebar.png" we have elipsis button that will be a Menu component that will have some actions, for now we can put edit and delete actions here
7. right now we dont know which fields are editable but lets assume we can edit all fields in Properties card in the sidebar
8. for documents tab you'll see we have 3 more tabs inside page content: domains, secirity settings and system. all figmas are attached also.
