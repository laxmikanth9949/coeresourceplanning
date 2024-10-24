 sap.ui.define([
     "sap/m/MessageBox",
     "sap/coe/capacity/reuselib/utils/TokenHelper",
     "sap/coe/capacity/reuselib/utils/i18n",
     "sap/coe/capacity/reuselib/utils/formatter"
 ], function(MessageBox, TokenHelper, i18n, oFormatter) {
     "use strict";

     var VariantHelper = {};

     VariantHelper.onFilterBarClear = function(oEvent) {
         TokenHelper.applyToFBItem(oEvent.getSource(), "sap.m.MultiComboBox", TokenHelper._setTokenChange, false);
         var oModel = oEvent.getSource().getModel("VariantFilterModel");
         oModel.setData({});
         //oModel.refresh();
         TokenHelper.applyToFBItem(oEvent.getSource(), "sap.m.MultiComboBox", TokenHelper._setTokenChange, true);
     };

     //TODO Replace with built-in FB model
     VariantHelper.setVariantFilterModel = function(oView) {
         var oVariantFilterModel = new sap.ui.model.json.JSONModel();
         oView.setModel(oVariantFilterModel, "VariantFilterModel");
     };

     VariantHelper.getFiltersSimple = function(oEvent) {
         var aFilters = [],
             oSelectionSet = oEvent.getParameter("selectionSet"),
             oFilter, sElementId, sElementPath, aTokens, sKey, sElementType;


         for (var i = 0; i < oSelectionSet.length; i++) {
             oFilter = null;
             sElementId = oSelectionSet[i].getId();
             sElementPath = sElementId.substring(oSelectionSet[i].getId().indexOf("For") + 3);
             sElementType = oSelectionSet[i].getMetadata().getName();
             if (oSelectionSet[i].getMetadata().getLibraryName() === "sap.coe.capacity.reuselib.controls" &&
                 oSelectionSet[i].getFragment().getTokens().length > 0) {
                 aTokens = oSelectionSet[i].getFragment().getTokens();

                 for (var iMItoken in aTokens) {
                     sKey = aTokens[iMItoken].getKey();
                     aFilters.push(new sap.ui.model.Filter(sElementPath, sap.ui.model.FilterOperator.EQ, sKey));
                 }
             } else if (sElementType === "sap.m.MultiInput" && oSelectionSet[i].getTokens().length > 0) {
                 aTokens = oSelectionSet[i].getTokens();

                 for (var iMItoken in aTokens) {
                     sKey = aTokens[iMItoken].getKey();
                     aFilters.push(new sap.ui.model.Filter(sElementPath, sap.ui.model.FilterOperator.EQ, sKey));
                 }
             } else if (sElementType === "sap.m.MultiComboBox" && oSelectionSet[i]._oTokenizer.getTokens().length > 0) {
                 aTokens = oSelectionSet[i]._oTokenizer.getTokens();

                 for (var iMCBtoken in aTokens) {
                     sKey = aTokens[iMCBtoken].getKey();
                     aFilters.push(new sap.ui.model.Filter(sElementPath, sap.ui.model.FilterOperator.EQ, sKey));
                 }
             } else if (oSelectionSet[i].getValue !== undefined && oSelectionSet[i].getValue() === "") {
                 continue;
             } else if (sElementType === "sap.m.DateRangeSelection") {
                 var oBegDate = oFormatter.removeTimeOffset(oSelectionSet[i].getDateValue()),
                     oEndDate = oFormatter.getDateForLastSecondOfDay(oSelectionSet[i].getSecondDateValue());
                 oEndDate = oFormatter.removeTimeOffset(oEndDate);                     

                 aFilters.push(new sap.ui.model.Filter("BegDate", sap.ui.model.FilterOperator.EQ, oBegDate));
                 aFilters.push(new sap.ui.model.Filter("EndDate", sap.ui.model.FilterOperator.EQ, oEndDate));

             } else if (sElementType === "sap.m.ComboBox") {
                 sKey = oSelectionSet[i].getSelectedKey();
                 if (sKey === "") continue;

                 var oSelectedItem = oSelectionSet[i].getSelectedItem(),
                     oBindingModel = oSelectedItem.getBindingContext("UtilsModel"),
                     bIsNegated = oBindingModel.getProperty(oBindingModel.sPath).isNegated,
                     bHasIdentifier = typeof oBindingModel.getProperty(oBindingModel.sPath).ID !== "undefined";
                 if (bHasIdentifier) sKey = oBindingModel.getProperty(oBindingModel.sPath).key;

                 if (bIsNegated === "true") {
                     aFilters.push(new sap.ui.model.Filter(sElementPath, sap.ui.model.FilterOperator.NE, sKey));
                 } else {
                     aFilters.push(new sap.ui.model.Filter(sElementPath, sap.ui.model.FilterOperator.EQ, sKey));
                 }


             } else if (sElementType === "sap.m.Input") {
                 sKey = oSelectionSet[i].getValue();
                 aFilters.push(new sap.ui.model.Filter(sElementPath, sap.ui.model.FilterOperator.EQ, sKey));
             }
         }
         return aFilters;
     };


     VariantHelper.getFilters = function(oEvent) {
         // TODO Create Factory Function when urls for OR are 
         // confirmed from Han
         var aFilters = [];
         var aFiltersEmpId = [];
         var aFiltersOrgUnit = [];
         var aFiltersServiceArea = [];
         var aFiltersQual = [];
         var aFinalFilter = [];
         var aFiltersAnd = [];
         var oOrgUnitFilter = {};
         var oEmpIdFilter = {};
         var oServiceAreaFilter = {};
         var oQualFilter = {};
         var oAndFilters = {};
         var ofinalFilter = {};
         var oSelectionSet = oEvent.getParameter("selectionSet");
         var oFilter, sElementId, sElementPath, aTokens, sKey;
         var bOrEmpId = false; //this.byId("orCheckBox1").getSelected();
         var bOrServiceArea = false; //this.byId("orCheckBox2").getSelected();
         var bOrQual = false;

         for (var i = 0; i < oSelectionSet.length; i++) {
             oFilter = null;
             sElementId = oSelectionSet[i].getId();
             sElementPath = sElementId.substring(oSelectionSet[i].getId().indexOf("For") + 3);
             if (oSelectionSet[i].getMetadata().getLibraryName() === "sap.coe.capacity.reuselib.controls" &&
                 oSelectionSet[i].getFragment().getTokens().length > 0) {
                 sElementId = oSelectionSet[i].getId();
                 sElementPath = sElementId.substring(oSelectionSet[i].getId().indexOf("For") + 3);
                 aTokens = oSelectionSet[i].getFragment().getTokens();
                 for (var iMItoken in aTokens) {
                     sKey = aTokens[iMItoken].getKey();
                     if (sElementPath.indexOf("EmpId") > -1) {
                         aFiltersEmpId.push(new sap.ui.model.Filter(sElementPath, sap.ui.model.FilterOperator.EQ, sKey));
                     } else if (sElementPath.indexOf("OrgId") > -1) {
                         aFiltersOrgUnit.push(new sap.ui.model.Filter(sElementPath, sap.ui.model.FilterOperator.EQ, sKey));
                     } else {
                         aFiltersQual.push(new sap.ui.model.Filter(sElementPath, sap.ui.model.FilterOperator.EQ, sKey));
                     }
                 }
             } else if (oSelectionSet[i].getMetadata().getName() === "sap.m.MultiInput" &&
                 oSelectionSet[i].getTokens().length > 0) {
                 aTokens = oSelectionSet[i].getTokens();
                 for (var iMItoken in aTokens) {
                     sKey = aTokens[iMItoken].getKey();
                     if (sElementPath.indexOf("EmpId") > -1) {
                         aFiltersEmpId.push(new sap.ui.model.Filter(sElementPath, sap.ui.model.FilterOperator.EQ, sKey));
                     } else if (sElementPath.indexOf("OrgId") > -1) {
                         aFiltersOrgUnit.push(new sap.ui.model.Filter(sElementPath, sap.ui.model.FilterOperator.EQ, sKey));
                     } else {
                         aFiltersQual.push(new sap.ui.model.Filter(sElementPath, sap.ui.model.FilterOperator.EQ, sKey));
                     }
                 }
             } else if (oSelectionSet[i].getMetadata().getName() === "sap.m.MultiComboBox" &&
                 oSelectionSet[i]._oTokenizer.getTokens().length > 0) {
                 aTokens = oSelectionSet[i]._oTokenizer.getTokens();
                 for (var iMCBtoken in aTokens) {
                     sKey = aTokens[iMCBtoken].getKey();
                     aFiltersServiceArea.push(new sap.ui.model.Filter(sElementPath, sap.ui.model.FilterOperator.EQ, sKey));
                 }
             } else if (oSelectionSet[i].getMetadata().getName() === "sap.m.DateRangeSelection" &&
                 oSelectionSet[i].getDateValue() !== "") {
                 var oBegDate = oSelectionSet[i].getDateValue(),
                     oEndDate = oSelectionSet[i].getSecondDateValue();
                 oEndDate = oFormatter.getDateForLastSecondOfDay(oEndDate);

                 aFiltersAnd.push(new sap.ui.model.Filter("BegDate", sap.ui.model.FilterOperator.EQ, oBegDate));
                 aFiltersAnd.push(new sap.ui.model.Filter("EndDate", sap.ui.model.FilterOperator.EQ, oEndDate));
             }
         }
         if (aFiltersEmpId.length < 1 && aFiltersOrgUnit.length < 1 &&
             aFiltersQual.length < 1 && aFiltersServiceArea.length < 1) {
             MessageBox.information(
                 "You have not input any filter criteria. Please provide input to filter by."
             );
             return;
         } else {
             if (aFiltersEmpId.length > 0) {
                 oEmpIdFilter = new sap.ui.model.Filter({
                     filters: aFiltersEmpId,
                     and: bOrEmpId
                 });
                 aFilters.push(oEmpIdFilter);
             }
             if (aFiltersServiceArea.length > 0) {
                 oServiceAreaFilter = new sap.ui.model.Filter({
                     filters: aFiltersServiceArea,
                     and: bOrServiceArea
                 });
                 aFilters.push(oServiceAreaFilter);
             }
             if (aFiltersQual.length > 0) {
                 oQualFilter = new sap.ui.model.Filter({
                     filters: aFiltersQual,
                     and: bOrQual
                 });
                 aFilters.push(oQualFilter);
             }
         }
         if (aFiltersOrgUnit.length > 0) {
             oOrgUnitFilter = new sap.ui.model.Filter({
                 filters: aFiltersOrgUnit,
                 and: false
             });
             aFilters.push(oOrgUnitFilter);
         } else {
             // aFiltersAnd.push(aFiltersOrgUnit[0]);
         }
         oAndFilters = new sap.ui.model.Filter({
             filters: aFiltersAnd,
             and: true
         });
         aFilters.push(oAndFilters);

         ofinalFilter = new sap.ui.model.Filter({
             filters: aFilters,
             and: true
         });
         aFinalFilter.push(ofinalFilter);
         return aFinalFilter;
     };

     return VariantHelper;

 });
