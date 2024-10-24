sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Token",
    "sap/ui/model/Filter",
    "sap/coe/capacity/reuselib/utils/TokenHelper",
    "sap/coe/capacity/reuselib/utils/formatter",
    "sap/coe/capacity/reuselib/utils/helpers"
], function (Controller, Token, Filter, TokenHelper, formatter, Helpers) {

    "use strict";

    return Controller.extend("sap.coe.capacity.reuselib.fragment.Organisation.fragment", {

        /**
         * Called when dialog is opened, clear the selections and attach sort event
         * @name onAfterOpen
         * @function
         * @param {Object} oEvent: object which called the event
         * @return {void}
         */
        onAfterOpen: function (oEvent) {
            this.onDeselectItemsInList(oEvent);
            this.attachSortOnRequestComplete(oEvent);
        },
        /**
         * Event that sorts the list when the data request has been completed
         * @name attachSortOnRequestComplete
         * @function
         * @param {Object} oEvent: object which called the event
         * @return {void}
         */
        attachSortOnRequestComplete: function (oEvent) {
            var oList = oEvent.getSource().byId("SelectOrganisationList"),
                oListModel = oList.getModel(),
                that = this;
            oListModel.attachRequestCompleted(function () {
                that.sortList(that);
            });
        },
        /**
         * Sorts the list binding alphabetically
         * @name sortList
         * @function
         * @param {Object} oContext: object which called the event
         * @return {void}
         */
        sortList: function (oContext) {
            var oListBinding = oContext.byId("SelectOrganisationList").getBinding("items");
            oListBinding.bClientOperation = true;
            oListBinding.aAllKeys = true;

            var oSortList = new sap.ui.model.Sorter("ServiceTeamName", false);
            oListBinding.sort(oSortList);

            oListBinding.bClientOperation = false;
            oListBinding.aAllKeys = null;
        },
        /**
         * Deselects everything in the list
         * @name onDeselectItemsInList
         * @function
         * @param {Object} oEvent: object which called the event
         * @return {void}
         */
        onDeselectItemsInList: function (oEvent) {
            var aSelectedToken = this.oView.getParent().byId(this.oView.sSourcefieldId).getTokens(),
                oList = oEvent.getSource().byId("SelectOrganisationList").attachItemPress(),
                aListItems = oList.getItems();

            for (var i = 0; i < aListItems.length; i++) {
                var selected = false;
                for (var k = 0; k < aSelectedToken.length; k++) {
                    if (aListItems[i].getBindingContext().sPath.indexOf(aSelectedToken[k].getKey()) !== -1) {
                        selected = true;
                        break;
                    }
                }
                aListItems[i].setSelected(selected);
            }
        },
        /**
         * Called when user selects/unselects a service team
         * @name onServiceTeamSelectionChange
         * @function
         * @param {Object} oEvent: object which called the event
         * @return {void}
         */
        onServiceTeamSelectionChange: function (oEvent) {
            var oModel = this.oView.getModel(),
                oSelectedContext = oEvent.getParameter("listItem").getBindingContext(),
                sProperty = oModel.getProperty(oSelectedContext.sPath, oSelectedContext),
                aItems = ["ServiceTeamID", "ServiceTeamName", "ServiceTeam"],
                sModelPath = oEvent.getSource().getId().substring(oEvent.getSource().getId().indexOf("For") + 3),
                sModelPath = sModelPath.split("--")[0];
            TokenHelper.storeSelectedItems(
                oEvent.getParameter("listItem").isSelected(),
                this.oView.getModel("TempModel").getData(),
                sProperty,
                aItems);
        },
        /**
         * Filters binding based on search value
         * @name OrganisationTypeSearch
         * @function
         * @param {Object} oEvent: object which called the event
         * @return {void}
         */
        OrganisationTypeSearch: function (oEvent) {
            var sValue = oEvent.getParameter("value"),
                oFilter = new Filter("ServiceTeamName", sap.ui.model.FilterOperator.Contains, sValue),
                oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },
        /**
         * Adds values from filter model as tokens in the input field
         * @name onApplyTokens
         * @function
         * @param {Object} oEvent: object which called the event
         * @return {void}
         */
        onApplyTokens: function (oEvent) {
            var oVariantFilterModel = this.oView.getModel("VariantFilterModel");
            TokenHelper.onApplyTokens(oEvent, oVariantFilterModel);
            this.onCloseDialog(oEvent);
        },
        /**
         * Closes the dialog
         * @name onCloseDialog
         * @function
         * @param {Object} oEvent: object which called the event
         * @return {void}
         */
        onCloseDialog: function (oEvent) {
            oEvent.getSource().getParent().close();
        }

    });
});