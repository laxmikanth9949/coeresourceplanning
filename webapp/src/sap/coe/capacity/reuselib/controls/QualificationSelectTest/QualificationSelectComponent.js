/**
 * @class
 * @name OrgUnitSelectComponent
 */
sap.ui.define([
    "sap/coe/capacity/reuselib/controls/BaseControl/BaseFragmentComponent",
    "sap/coe/capacity/reuselib/utils/TokenHelperTest",
    "sap/coe/capacity/reuselib/utils/messages",
    "sap/coe/capacity/reuselib/utils/formatter"
], function(BaseFragmentComponent, TokenHelper, Messages) {
    "use strict";

    var QualificationSelect = BaseFragmentComponent.extend("sap.coe.capacity.reuselib.controls.QualificationSelectTest.QualificationSelectComponent", {




        metadata: {
            events: {
                onRetrieveData: {}
            },
            properties: {
              //The path execute filter on 
              filterPath: {
                type: "string",
                defaultValue: undefined
              },
              //The String to add to QOID for proficiency
              proficiency: {
                type: "string",
                defaultValue: ""
              }              
            }          
        },

        renderer: {},

        /**
         * This function is called when the component is being initialized
         * @name init
         * @function
         * @memberOf StandardNotesListComponent#
         * @return {void}
         */
        init: function() {
            var sSearchParameter;
            //Instanciate fragment controller and fragment
            this._initFragment(
                "",
                "sap.coe.capacity.reuselib.controls.QualificationSelect.QualificationSelectMultiInput"
            );
            sSearchParameter = this.getFragmentId().substring(this.getFragmentId().indexOf("For") + 3);
            sSearchParameter = sSearchParameter.split("--")[0];
            if (!this.getFilterPath()) {
              this.setFilterPath(sSearchParameter);
            }      
            if (typeof this.getFilterPath() !== "undefined" ){
                var oTokenBindingInfo = this._oFragment.getBindingInfo("tokens");
                oTokenBindingInfo.path = "/" + this.getFilterPath() + "/tokens";
            }      
            this.addValidator(this.getFragment(), this.getFilterPath(), this);   
        },

        /**
         * This function is called after rendering of the component. In here the model is already bound to the control
         * @name onAfterRendering
         * @function
         * @memberOf StandardNotesListComponent#
         * @return {void}
         */
        onAfterRendering: function() {}

/*        onBeforeRendering: function() {
            if (typeof this.getFilterPath() !== "undefined" ){
                var oTokenBindingInfo = this._oFragment.getBindingInfo("tokens");
                oTokenBindingInfo.path = "/" + this.getFilterPath() ;
            }
        } */       

    });


    QualificationSelect.prototype.addValidator = function(oObject, sPath, that) {
        oObject.addValidator(function(args) {
            var sProficiency = that.getProficiency();
            var VariantFilterModel = oObject.getModel("VariantFilterModel");
            var oData = VariantFilterModel.getProperty("/" + sPath) ? VariantFilterModel.getProperty("/" + sPath) : {};
            var sText = args.text;
            var sId = sText + sProficiency;
            TokenHelper.addToken(oData, sText, sId, sPath, true);
            VariantFilterModel.setProperty("/" + sPath, oData);
            oObject.getModel("VariantFilterModel").refresh();
            oObject.setValue("");
        }); 
    };    


    QualificationSelect.prototype.onQualificationDialogOpen = function(oEvent) {
        this._sFragmentId = this.getId() + "--" + "SkillSelectTree";
        var VariantFilterModel = this.getModel("VariantFilterModel");
        var aData = VariantFilterModel.getProperty("/" + this.getFilterPath()) ? VariantFilterModel.getProperty("/" + this.getFilterPath()) : {};
        var aDataCopy = jQuery.extend(true, {}, aData);
        this.oQualificationsList = {};
        if (!this._oDialogSkillSelectTree) {
            this._oDialogSkillSelectTree = sap.ui.xmlfragment(this._sFragmentId,
                "sap.coe.capacity.reuselib.controls.QualificationSelectTest.QualificationSelect", this);
            this.addDependent(this._oDialogSkillSelectTree);
        }
        this.oQualificationDialog = sap.ui.core.Fragment.byId(this._sFragmentId, "QualificationDialog").setShowNavButton(true);
        this.oQualificationDialog.setShowNavButton(false);
        this.oQualificationsList = sap.ui.core.Fragment.byId(this._sFragmentId, "qualificationCatalogList");
        this._oDialogSkillSelectTree.setModel(new sap.ui.model.json.JSONModel(aDataCopy), "TempModel");
        this.oNavigation = [];
        this.oNavigation.push({
            id: "93100025"
        });
        this._setAggregation(this.oNavigation[0].id, this.oQualificationsList, "QOID");
        jQuery.sap.syncStyleClass("sapUiSizeCompact", this, this._oDialogSkillSelectTree);
        this._oDialogSkillSelectTree.open();
    };

    QualificationSelect.prototype._setAggregation = function(sCatologId, oList, sFilter) {
        this.sSelectedQK = sCatologId;
        var aFilters = this._createFilters(sFilter, sCatologId);

        if (this.oNavigation.length > 1) {
            oList.setMode("MultiSelect");
        } else {
            oList.setMode("None");
        }
        var oItemTemplateQualification = new sap.m.StandardListItem({
            title: "{QDescriptionSText}",
            description: "{path: 'QOID'}",
            selected: "{path: 'QOID', formatter: 'sap.coe.capacity.reuselib.utils.formatter.isSelectedNew'}",
            type: "{path: 'QOTYPE', formatter: 'sap.coe.capacity.reuselib.utils.formatter.formatItemType'}"
        });

        oList.bindAggregation("items", {
            path: "/QualificationList",
            filters: aFilters,
            template: oItemTemplateQualification,
            templateShareable: true
        });
        oList.setBusy(false);
    };

    QualificationSelect.prototype._createFilters = function(sFilter, sCatologId) {
        var aFilters = [];
        aFilters.push(new sap.ui.model.Filter("BegDate", sap.ui.model.FilterOperator.EQ, new Date()));
        aFilters.push(new sap.ui.model.Filter("EndDate", sap.ui.model.FilterOperator.EQ, new Date()));
        aFilters.push(new sap.ui.model.Filter(sFilter, sap.ui.model.FilterOperator.EQ, sCatologId));
        return aFilters;
    };

    QualificationSelect.prototype.onQualificationNav = function(oEvent) {
        var aFilters = [],
        	sSelectedContext = oEvent.getParameter("listItem").getBindingContext(),
        	sSelectedId = this.getModel().getProperty(sSelectedContext.sPath, sSelectedContext).QOID;
        this.oNavigation.push({
            id: sSelectedId
        });
        this.oQualificationsList.setBusy(true);
        this.oQualificationDialog.setShowNavButton(true);
        aFilters = this._createFilters("QOID", this.oNavigation[(this.oNavigation.length - 1)].id);
        if (this.oNavigation.length > 1) {
            this.oQualificationsList.setMode("MultiSelect");
        } else {
            this.oQualificationsList.setMode("None");
        }
        this.oQualificationsList.getBinding("items").aApplicationFilters = [];
        this._setAggregation(this.oNavigation[(this.oNavigation.length - 1)].id, this.oQualificationsList, "QOID");
    };

    QualificationSelect.prototype.onQualificationNavBack = function() {
        this.oQualificationsList.setBusy(true);
        this.oNavigation.pop();
        var aFilters = this._createFilters("QOID", this.oNavigation[(this.oNavigation.length - 1)].id);
        if (this.oNavigation.length < 2) {
            this.oQualificationDialog.setShowNavButton(false);
        }
        //this._setAggregation(this.oNavigation[this.oNavigation.length - 1].id, oQualificationsList, "QOID");
        this.oQualificationsList.getBinding("items").aApplicationFilters = [];
        this.oQualificationsList.getBinding("items").filter(aFilters);
        this.oQualificationsList.setBusy(false);
    };

    QualificationSelect.prototype.onQualificationSeclectionChange = function(oEvent) {
        var oModel = this.getModel();
        var sSelectedContext = oEvent.getParameter("listItem").getBindingContext();
        var sSelectedId = oModel.getProperty(sSelectedContext.sPath, sSelectedContext).QOID;
        var sQOTYPE = oModel.getProperty(sSelectedContext.sPath, sSelectedContext).QOTYPE;
        var bIsBranch = (sQOTYPE === "QK") ? true : false;
        if (bIsBranch) {
            this._selectQualificationBranch(this, oEvent.getParameter("listItem").isSelected(), sSelectedId);
        } else {
            this._selectQualificationLeaf(this, oEvent, sSelectedContext);
        }
    };

    QualificationSelect.prototype._selectQualificationBranch = function(that, bIsSelected, sSelectedId) {
        var aFilters = aFilters = this._createFilters("QOID", sSelectedId),
        	sProficiency = this.getProficiency();
        this.getModel().read("/QualificationList", {
            filters: aFilters,
            success: function(oData, response) {
                var oQualifications = oData.results;
                var iQualification, sId;
                var aTempModelData = that._oDialogSkillSelectTree.getModel("TempModel").getProperty("/");
                if (bIsSelected) {
                    that._toggleSelected(aTempModelData, sSelectedId, true);
                    for (iQualification in oQualifications) {
                        sId = oQualifications[iQualification].QOID + sProficiency;
                        var sText = oQualifications[iQualification].QDescriptionSText;

                        TokenHelper.addToken(aTempModelData, sText, sId, true);
                    }
                } else {
                    that._toggleSelected(that._oDialogSkillSelectTree.getModel("TempModel").getProperty("/"), sSelectedId, false);
                    for (iQualification in oQualifications) {
                        sId = oQualifications[iQualification].QOID + sProficiency;
                        TokenHelper.removeToken(aTempModelData, sId, true);
                    }
                }
            },
            error: function(response) {
                Messages.showErrorMessage(response);
            }
        });
    };

    QualificationSelect.prototype._selectQualificationLeaf = function(that, oEvent, sSelectedContext) {
        var sProperty = that.getModel().getProperty(sSelectedContext.sPath, sSelectedContext);
        var aItems = ["QOID", "QDescriptionSText"];
        this._storeSelectedItems(oEvent.getParameter("listItem").isSelected(),
            this._oDialogSkillSelectTree.getModel("TempModel").getProperty("/"), sProperty, aItems);
    };

    QualificationSelect.prototype._storeSelectedItems = function(bIsSelected, oObject, sProperty, aItems) {
        var sSelectedId = sProperty[aItems[0]] + this.getProficiency();
        if (bIsSelected) {
            var sText = sProperty[aItems[1]];
            TokenHelper.addToken(oObject, sText, sSelectedId, true);
        } else {

            TokenHelper.removeToken(oObject, sSelectedId, true);
        }
        return oObject;
    };


    QualificationSelect.prototype.onApplyTokens = function(oEvent) {
        var oVariantFilterModel = this.getModel("VariantFilterModel");
        TokenHelper.onApplyTokens(oEvent, oVariantFilterModel);
        this.onCloseDialog(oEvent);
    };

    QualificationSelect.prototype.onTokenChange = function(oEvent) {
        var oVariantFilterModel = this.getModel("VariantFilterModel");
        //TokenHelper.onTokenChange(oEvent, oVariantFilterModel);
    };

    QualificationSelect.prototype.onTokenDelete = function(oEvent) {
    	var oVariantFilterModel = this.getModel("VariantFilterModel");
        if (typeof this.getFilterPath() === "undefined" ){
            TokenHelper.onTokenDelete(oEvent, oVariantFilterModel);
        } else {
            TokenHelper.onTokenDeleteParam(oEvent, oVariantFilterModel, this.getFilterPath());
        }
    };      


    QualificationSelect.prototype._toggleSelected = function(oData, sKey, bSetSelected) {
        TokenHelper._isFirstToken(oData, true);
        if (bSetSelected) {
            oData.selected[sKey] = true;
        } else {
            delete oData.selected[sKey];
        }
        return oData;
    };

    /**
     * 
     * 
     * @param {oEvent} Event object
     * @return {void} 
     * @public
     */
    QualificationSelect.prototype.onCloseDialog = function(oEvent) {
        oEvent.getSource().getParent().close();
    };

    return QualificationSelect;
});