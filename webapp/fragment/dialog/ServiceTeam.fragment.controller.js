sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/Token",
    "sap/ui/model/Filter",
    "sap/coe/capacity/reuselib/utils/TokenHelper",
    "sap/coe/capacity/reuselib/utils/formatter"
], function(Controller, Token, Filter, TokenHelper, formatter) {

    "use strict";

    return Controller.extend("sap.coe.rpa.fragment.dialog.ServiceTeam", {

        
        onAfterOpen: function(oEvent){
            this.onDeselectItemsInList(oEvent);
        },

        onDeselectItemsInList: function(oEvent){
            var aSelectedToken = this.getView().getParent().byId("idServiceTeamForOrgId").getTokens();
            var oList = sap.ui.core.Fragment.byId("__xmlview1--ServiceTeam","SelectOrganisationList");
            var aListItems = oList.getItems();

            for (var i = 0; i < aListItems.length; i++){
                var selected = false;
                for (var k =0; k < aSelectedToken.length; k++){
                    if(aListItems[i].getBindingContext().sPath.indexOf(aSelectedToken[k].getKey()) !== -1){
                        selected = true;
                        break;
                    }             
                }
              aListItems[i].setSelected(selected);
            }
        },  
        onServiceTeamSelectionChange: function(oEvent) {
            var oModel = this.oView.getModel();
            var oSelectedContext = oEvent.getParameter("listItem").getBindingContext();
            var sProperty = oModel.getProperty(oSelectedContext.sPath, oSelectedContext);
            var aItems = ["ServiceTeamID", "ServiceTeamName", "ServiceTeam"];
            TokenHelper.storeSelectedItems(
                oEvent.getParameter("listItem").isSelected(),
                this.oView.getModel("TempModel").getData(), 
                sProperty, 
                aItems);
        },
        OrganisationTypeSearch: function(oEvent) {
            var sValue = oEvent.getParameter("value");
            var oFilter = new Filter("ServiceTeamName", sap.ui.model.FilterOperator.Contains, sValue);
            var oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter([oFilter]);
        },

        onApplyTokens : function(oEvent) {
            var oVariantFilterModel = this.oView.getModel("VariantFilterModel");
            TokenHelper.onApplyTokens(oEvent, oVariantFilterModel);
            this.onCloseDialog(oEvent);
        },

        /**
         * 
         * 
         * @param {oEvent} Event object
         * @return {void} 
         * @public
         */
        onCloseDialog : function(oEvent) {
            oEvent.getSource().getParent().close();
        }    

    });
});
