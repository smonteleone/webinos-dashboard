webinos-dashboard
=================

Dashboard API of webinos


### Explorer Module ###
Module: "explorer"

#### Data ####
- *service* <br/>
String or array of strings. The services you want to filter/discover. <br/>
Default: "*"
- *select* <br/>
String. The type you want to be selected. <br/>
Allowed: "people", "devices", "services", "none" <br/>
Default: "services"
- *show* <br/>
String. The type you want to show. <br/>
Allowed: "people", "devices", "services" <br/>
Default: "services"
- *multiselect* <br/>
Boolean. If you want to allow multiple selections. <br/>
Default: false

#### Result ####
Result is always an array of objects containing the selections. The properties of the objects depends on the user selected types.
- *id*
- *type*
- *friendlyName*
- *api* _(only if the type is service)_
- *address* _(only if the type is service)_
- *deviceType* _(only if the type is device)_
