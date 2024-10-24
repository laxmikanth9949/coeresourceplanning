sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Token",
    "sap/ui/model/Filter",
    "sap/coe/capacity/reuselib/utils/TokenHelper",
    "sap/coe/capacity/reuselib/utils/formatter"
], function (Controller, Token, Filter, TokenHelper, formatter) {

    "use strict";

    return Controller.extend("sap.coe.capacity.reuselib.fragment.ProductSearch.fragment", {
        /**
         * Called after the dialog has been opened
         * @name onAfterOpen
         * @function
         * @param {Object} oEvent: object which called the event
         * @return {void}
         */
        onAfterOpen: function (oEvent) {
            this._deselectItemsInList(oEvent.getSource().byId("productSearchList"));
        },
        /**
         * Deselects items in list not currently in the filter model (user clicked cancel when previously using dialog)
         * @name _deselectItemsInList
         * @function
         * @param {Object} oList: list object which called the event
         * @return {void}
         */
        _deselectItemsInList: function (oList) {
            var aSelectedToken = this.oView.getParent().byId("idForProductID").getTokens(),
                aListItems = oList.getItems(),
                oBindingContext,
                resourceObject,
                resourceKey,
                tokenKey;

            for (var i = 0; i < aListItems.length; i++) {
                var selected = false;
                for (var k = 0; k < aSelectedToken.length; k++) {
                    oBindingContext = aListItems[i].getBindingContext();
                    resourceObject = oBindingContext.oModel.getProperty(oBindingContext.sPath);
                    resourceKey = parseInt(resourceObject.ProductID, 10);
                    tokenKey = parseInt(aSelectedToken[k].getKey(), 10);
                    if (resourceKey === tokenKey) {
                        selected = true;
                        break;

                    }
                }
                aListItems[i].setSelected(selected);
            }
        },
        /**
         * Fires when user selects/unselects an item from the list
         * @name onProductSelectionChange
         * @function
         * @param {Object} oEvent: object which called the event
         * @return {void}
         */
        onProductSelectionChange: function (oEvent) {
            var oModel = this.oView.getModel(),
                oSelectedContext = oEvent.getParameter("listItem").getBindingContext(),
                sProperty = oModel.getProperty(oSelectedContext.sPath, oSelectedContext),
                aItems = ["ProductID", "ProductDescription", "ProductID"],
                sModelPath = oEvent.getSource().getId().substring(oEvent.getSource().getId().indexOf("For") + 3);
            sModelPath = sModelPath.split("--")[0];
            sProperty.ProductID = parseInt(sProperty.ProductID, 10).toString(); //Remove left zeros
            TokenHelper.storeSelectedItems(
                oEvent.getParameter("listItem").isSelected(),
                this.oView.getModel("TempModel").getData(),
                sProperty,
                aItems);
        },
        /**
         * Fires when user enters a search term, filters the product list
         * @name onSearchProduct
         * @function
         * @param {Object} oEvent: object which called the event
         * @return {void}
         */
        onSearchProduct: function (oEvent) {
            var oProductDesc = this.oView.byId("searchFieldProductDesc").getValue(),
                oProductId = this.oView.byId("searchFieldProductId").getValue(),
                aFilters = [];

            if (oProductDesc.trim().length > 0) {
                aFilters.push(new Filter("ProductDescription", sap.ui.model.FilterOperator.Contains, oProductDesc.trim()));
            }
            if (oProductId.trim().length > 0) {
                aFilters.push(new Filter("ProductID", sap.ui.model.FilterOperator.Contains, oProductId.trim()));
            }
            if (aFilters.length > 0) {
                var oDialogView = this.oView,
                    oProductListTemplate = new sap.m.StandardListItem({
                        title: "{ProductDescription}",
                        description: "{path: 'ProductID', formatter: 'sap.coe.capacity.reuselib.utils.formatter.toInteger'}"
                    });

                oDialogView.setBusy(true);

                this.oView.byId("productSearchList").bindAggregation("items", {
                    path: "/ServiceProductSet",
                    filters: aFilters,
                    template: oProductListTemplate
                });

                this.oView.byId("productSearchList").getBinding("items").attachDataReceived(function (oData) {
                    oDialogView.setBusy(false);
                });
            }
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
            TokenHelper.onApplyTokens(oEvent, oVariantFilterModel, "ProductID");
            this.onCloseDialog(oEvent);
        }

    });

});