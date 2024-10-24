sap.ui.define([
    "sap/coe/capacity/reuselib/utils/messages",
    "sap/m/Token"
], function(Messages, Token) {
    "use strict";


    var TokenHelper = {};

    /* eslint-disable sap-no-ui5base-prop */
    /* eslint-disable sap-no-event-prop */
    /**
     * Remove Token from Model if event
     * type is delete
     * @param {oEvent} Event object
     * @param {object} Model
     * @param {str} identifier for input
     * @return {void} 
     * @public
     */
    TokenHelper.onTokenDeleteParam = function(oEvent, oModel, sType) {
        if (oEvent.sId !== "delete") {return;}
        var sKey = oEvent.getSource().getProperty("key");
        this.removeToken(oModel.getProperty("/" + sType), sKey, sType, true);
    };


    /**
     * Remove Token from Model
     * 
     * @param {object} Data object
     * @param {str} Token key
     * @param {str} identifier for input
     * @param {boolean} Type of input is MultiInput
     * @return {object} Data object 
     * @public
     */

    //TODO: Simplify 
    TokenHelper.removeToken = function(oData, sKey, bIsMultiInput) {
        if (bIsMultiInput && oData && oData.selected[sKey]) {
            $.grep(oData.tokens, function(e) {
                return e.id === sKey; });
            oData.tokens = $.grep(oData.tokens, function(e) {
                return e.id !== sKey; });
            delete oData.selected[sKey];
        }
        return oData;
    };


    /**
     * Sets TempModel tokens back into Main model
     * 
     * @param {object} oEvent
     * @param {object} Main Model
     * @return {void}
     * @public
     */

    TokenHelper.onApplyTokens = function(oEvent, oModel) {
        var sFilterPath = "/" + oEvent.getSource().getParent().getParent().getFilterPath();
        var oData = oEvent.getSource().getModel("TempModel").getProperty("/");
        //Delete all tokens to avoid duplicate id
        oModel.setProperty(sFilterPath, {});
        oModel.setProperty(sFilterPath, oData);
    };


    /**
     * Add token obj into data obj
     * 
     * @param {object} Data object
     * @param {str} Token Text
     * @param {str} Token key
     * @param {boolean} Type of input is MultiInput
     * @return {object} Data object 
     * @public
     */

    TokenHelper.addToken = function(oData, sText, sKey, bIsMultiInput) {
        TokenHelper._isFirstToken(oData, bIsMultiInput);
        if (bIsMultiInput) {
            oData.selected[sKey] = true;
            oData.tokens.push({ id: sKey, name: sText });
        } else {
            oData.push(sKey);
        }
        return oData;
    };

    TokenHelper.storeSelectedItems = function(bIsSelected, oObject, sProperty, aItems) {
        var sSelectedId = sProperty[aItems[0]];
        if (bIsSelected) {
            var sText = sProperty[aItems[1]];
            this.addToken(oObject, sText, sSelectedId, true);
        } else {

            this.removeToken(oObject, sSelectedId, true);
        }
        return oObject;
    };


    /**
     * Constructor for first tokens
     * 
     * @param {object} Data object
     * @param {boolean} Type of input is MultiInput
     * @return {object} Data object 
     * @public
     */

    TokenHelper._isFirstToken = function(oData, bIsMultiInput) {
        if (jQuery.isEmptyObject(oData) && bIsMultiInput) {
            oData.tokens = [];
            oData.selected = {};
        } else if (jQuery.isEmptyObject(oData) && !bIsMultiInput) {
            oData = [];
        }
        return oData;
    };

    return TokenHelper;

});