sap.ui.define([
    "sap/coe/capacity/reuselib/utils/messages",
    "sap/m/Token"
], function(Messages, Token) {
    "use strict";


    var TokenHelper = {};

    /**
     * TODO: Delete function if not in use
     * 
     * @param {oEvent} Event object
     * @return {void} 
     * @public
     */

    TokenHelper.onTokenDelete = function(oEvent, oModel) {
        var sPath = oEvent.getSource().getBindingContext("VariantFilterModel").sPath,
            sType = sPath.split("/")[1],
            sKey = oEvent.getParameter("token").getProperty("key");

        this.removeToken(oModel.getData(), sKey, sType, true);

    };

    TokenHelper.onTokenChange = function(oEvent) {
        var sTokenChangeType = oEvent.getParameter("type");
        if (sTokenChangeType !== "tokensChanged") {
            var bIsMultiInput = oEvent.getSource().getMetadata().getName() === "sap.m.MultiInput";
            if (!oEvent.getSource().getParent()) {
                return;
            }
            var oModel = oEvent.getSource().getParent().getModel("VariantFilterModel");
            var sType = TokenHelper._getFilterType(oEvent.getSource(), bIsMultiInput);
            var sKey = oEvent.getParameter("token").getProperty("key");
            var sText = oEvent.getParameter("token").getProperty("text");
            sType = sType.split("-")[0];
            if (sTokenChangeType === "added") {
                var oData = TokenHelper._addToken(oModel.getData(), sText, sKey, sType, bIsMultiInput);

            } else if (sTokenChangeType === "removed") {
                var oData = TokenHelper.removeToken(oModel.getData(), sKey, sType, bIsMultiInput);
            }

        }

    };

    TokenHelper.onComboBoxChange = function(oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");
        var oSelectedItemKey = oSelectedItem.getProperty("key");
        var sId = oEvent.getSource().getId();
        var sType = sId.substring(sId.indexOf("For") + 3);
        var oData = oEvent.getSource().getParent().getModel("VariantFilterModel").getData();
        oData[sType] = "";
        oData[sType] = oSelectedItemKey;
    };

    TokenHelper._getFilterType = function(oObject, bIsMultiInput) {
        var sId,
            sType = "";
        if (bIsMultiInput) {
            sId = oObject.getParent().getParent().getId();
        } else {
            sId = oObject.getParent().getId();
        }
        if (sId.indexOf("___") > 1) {
            sType = sId.substring(sId.indexOf("___") + 3);
        } else {
            sType = sId.substring(sId.indexOf("For") + 3);

        }
        return sType;
    };

    TokenHelper.getFilterTypeToken = function(oObject) {
        // Get the Binding path to use to set property to model
        var sPath = oObject.getBindingInfo("tokens").path;
        return sPath.split("/")[1];
    };

    /**
     * Removes token and key from data object
     *
     * @param {Object} oData -  Model data passed by reuse components
     * @param {String} sKey - key property value (e.g. value of property QualificationID)
     * @param {String} sType - path of filter property
     * @param {Boolean} bIsMultiInput boolean to mark if filter field is a sap.m.MultiInput
     * @param {Boolean} bQualForCapAnal boolean to mark if filter is a qualification in Capacity Analysis app
     * @return {Object} oData - updated data object with token and key removed
     * @public
     */
    TokenHelper.removeToken = function(oData, sKey, sType, bIsMultiInput, bQualForCapAnal) {
        if (bIsMultiInput && oData[sType] && oData[sType][sKey]) {
            $.grep(oData[sType], function(e) {
                return e.id === sKey;
            });
            oData[sType] = $.grep(oData[sType], function(e) {
                return e.id !== sKey;
            });
            delete oData[sKey];

        // If statement to handle Capacity Analysis qualification structure {tokens:[{id: "", name ""}, ...], selected:{key: boolean, key: boolean}}
        } else if (bIsMultiInput && oData[sType] && bQualForCapAnal && this._containsKey(oData[sType].tokens, sKey)) {
            $.grep(oData[sType].tokens, function(e) {
                return e.id === sKey;
            });
            oData[sType].tokens = $.grep(oData[sType].tokens, function(e) {
                return e.id !== sKey;
            });

            delete oData[sType].selected[sKey];
        // If statement to handle structure {[{id: "", name ""}, ...], {key: boolean, key: boolean}}
        } else if (bIsMultiInput && oData[sType] && this._containsKey(oData[sType], sKey)) {
            $.grep(oData[sType], function(e) {
                return e.id === sKey;
            });
            oData[sType] = $.grep(oData[sType], function(e) {
                return e.id !== sKey;
            });
            delete oData[sKey];

        } else if (!bIsMultiInput && oData[sType] && oData[sType][sKey]) {
            $.grep(oData[sType], function(e) {
                return e === sKey;
            });
            oData[sType] = $.grep(oData[sType], function(e) {
                return e !== sKey;
            });

        }
        return oData;
    };

    /**
     * Checks if array to be mapped to tokens aggregration of sap.m.MultiInput contains key
     *
     * @param {Object[]} aItems - array mapped to tokens
     * @param {String} sKey - key property value (e.g. value of property QualificationID)
     * @return {Boolean} true if contains keys, false is does not contain key
     * @public
     */
    TokenHelper._containsKey = function(aItems, sKey) {
        for (var i = 0; i < aItems.length; i++) {
            if (aItems[i].id === sKey) {
                return true;
            }
        }

        return false;
    };

    /**
     * Applies data from TempModel to the VariantFilterModel. Changes to tokens and keys are stored in TempModel
     * until confirmed (i.e. by press of dialog OK button) or abandoned (i.e by press of dialog Cancel button)
     *
     * @param {Object} oEvent - event triggered by user action
     * @param {Object} oModel
     * @public
     */
    TokenHelper.onApplyTokens = function(oEvent, oModel) {
        var oDialog = oEvent.getSource().getParent();
        var oData = oDialog.getModel("TempModel").getData();
        oModel.setProperty("/", {});
        oModel.setProperty("/", oData);
    };


    TokenHelper.storeSelectedItems = function(bIsSelected, oObject, sProperty, aItems) {
        var sSelectedId = sProperty[aItems[0]];
        if (bIsSelected) {
            var sText = sProperty[aItems[1]];
            this._addToken(oObject, sText, sSelectedId, aItems[2], true);
        } else {

            this.removeToken(oObject, sSelectedId, aItems[2], true);
        }
        return oObject;
    };

    /**
     * Adds token to data object and sets selected key to true
     *
     * @param {Object} oData -  Model data passed by reuse components
     * @param {String} sText - text/description to be mapped to token
     * @param {String} sKey - key property value (e.g. value of property QualificationID)
     * @param {String} sType - path of filter property
     * @param {Boolean} bIsMultiInput boolean to mark if filter field is a sap.m.MultiInput
     * @param {Boolean} bQualForCapAnal boolean to mark if filter is a qualification in Capacity Analysis app
     * @return {Object} oData - updated data object with token and key added
     * @public
     */
    TokenHelper._addToken = function(oData, sText, sKey, sType, bIsMultiInput, bQualForCapAnal) {
        // If bQualForCapAnal is true adding of token and key is handled for following structure:
        // {tokens:[{id: "", name ""}], selected:{key: boolean, key: boolean}}
        if (!bQualForCapAnal) {
            if (!oData[sType]) {
                oData[sType] = [];
            }
            if (bIsMultiInput) {
                oData[sKey] = true;
                oData[sType].push({ id: sKey, name: sText });
            } else {
                oData[sType].push(sKey);
            }
        // If bQualForCapAnal is not true handing adding of token and key according to default structure:
        // {[{id: "", name ""}, ...], {key: boolean, key: boolean}}
        } else {
            if (!oData[sType]) {
                oData[sType] = {tokens:[], selected: {}};
            }
            oData[sType].tokens.push({ id: sKey, name: sText });
            oData[sType].selected[sKey] = true;
        }
        return oData;
    };

    TokenHelper.applyToFBItem = function(oFilterBar, sControl, fn, bAdd) {
        var aFitlerBarItems = oFilterBar.getAggregation("content") ? oFilterBar.getAggregation("content")[1].getAggregation("content") : [];
        for (var iItem in aFitlerBarItems) {
            var itemContent = aFitlerBarItems[iItem].getAggregation("content");
            if (itemContent && (itemContent[1].getMetadata().getName() === sControl)) {
                fn(aFitlerBarItems[iItem].getAggregation("content")[1], bAdd);
            }
        }
    };

    /**
     * Basic MultiInput Validator
     * @name addValidator
     * @function
     * @memberOf BaseFragmentComponent#
     * @param {Object} sap.m.MultiInput 
     * @return {Object} controller for the fragment
     */
    TokenHelper.addValidator = function(oMultiInput) {
        oMultiInput.addValidator(function(args) {
            var sText = args.text;
            return new sap.m.Token({ key: sText, text: sText });
        });
    };

    TokenHelper._setTokenChange = function(oItem, bAdd) {
        var oTokenizer = oItem._oTokenizer ? oItem._oTokenizer : oItem._tokenizer;
        if (bAdd) {
            oTokenizer.attachTokenChange(TokenHelper.onTokenChange, oItem._oTokenizer);
        } else {
            oTokenizer.detachTokenChange(TokenHelper.onTokenChange, oItem._oTokenizer);
        }
        /*  var sType = TokenHelper._getFilterType(aFitlerBarItems[iItem].getAggregation("content")[1], true);
         this.getView().getModel("VariantFilterModel").getData()[sType] = [];*/
    };



    return TokenHelper;

});