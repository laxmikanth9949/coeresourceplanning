sap.ui.define([
    "sap/ui/test/Opa5",
    "sap/coe/rpa/test/integration/pages/Common",
    "sap/coe/rpa/test/integration/util/IntegrationActionHelper",
    "sap/ui/test/actions/Press",
    "sap/ui/test/actions/EnterText"
], function(Opa5, Common, IntegrationActionHelper, Press, EnterText) {
    "use strict";

    Opa5.createPageObjects({
        onTeamCalendarPage: {
            actions: {
                Init: function() {
                    IntegrationActionHelper.setTestContext(this);
                    this.testVariables = {};
                },

                iPressButton: function(sButtonId, bDialog, sSuccessMessage, sErrorMessage) {
                    return IntegrationActionHelper.iPressButton(sButtonId, bDialog, sSuccessMessage, sErrorMessage);
                },

                iPressOnIcon: function(sInputId, sSrc, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.ui.core.Icon",
                        matchers: [new sap.ui.test.matchers.PropertyStrictEquals({
                            name: "src",
                            value: sSrc
                        })],
                        check: function(aInputs) {
                            for (var i = 0; i < aInputs.length; i++) {
                                if (aInputs[i].getId().indexOf(sInputId) > -1) {
                                    new Press().executeOn(aInputs[i]);
                                    return true;
                                }
                            }
                        },
                        success: function(aInputs) {

                            ok(true, sSuccessMessage || "Clicked on icon of type " + sSrc + " with id " + sInputId + ".");
                        },
                        errorMessage: sErrorMessage || "Unable to click on the icon of type " + sSrc + " with id " + sInputId + "."
                    });
                },


                iChangeInputValue: function(sInputFieldId, sNewValue, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.Input",
                        check: function(aInputs) {
                            for (var i = 0; i < aInputs.length; i++) {
                                if (aInputs[i].getId().indexOf(sInputFieldId) > -1) {
                                    var setTextEvent = new EnterText().setText(sNewValue);
                                    setTextEvent.executeOn(aInputs[i]);
                                    return true;
                                }
                            }
                        },
                        success: function(aInputs) {

                            ok(true, sSuccessMessage || "Changed text value of Input with id: " + sInputFieldId + " to " + sNewValue);
                        },
                        errorMessage: sErrorMessage || "Unable to change text value of Input with id: " + sInputFieldId + " to " + sNewValue
                    });
                },


                iPressOnValueHelpRequestMultiInput: function(sInputId, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.MultiInput",
                        check: function(aInputs) {
                            for (var i = 0; i < aInputs.length; i++) {
                                if (aInputs[i].getId().indexOf(sInputId) > -1) {
                                    aInputs[i].fireValueHelpRequest();
                                    return true;
                                }
                            }
                        },
                        success: function() {
                            ok(true, sSuccessMessage || "Value help for MultiInput " + sInputId + " triggered.");
                        },
                        errorMessage: sErrorMessage || "Failed to trigger value help for MultiInput " + sInputId + "."
                    });
                },

                iSelectRadioButton: function(iPosition, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        searchOpenDialogs: true,
                        controlType: "sap.m.RadioButton",
                        check: function(aRadioButtons) {
                            new Press().executeOn(aRadioButtons[iPosition]);
                            return true;
                        },
                        success: function() {
                            ok(true, sSuccessMessage || "Click on RadioButton of position " + iPosition + ".");
                        },
                        errorMessage: sErrorMessage || "Not possible to click on RadioButton of position " + iPosition + "."
                    });
                },

                iSelectCheckBox: function(iPosition, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        searchOpenDialogs: true,
                        controlType: "sap.m.CheckBox",
                        check: function(aCheckBoxes) {
                            new Press().executeOn(aCheckBoxes[iPosition]);
                            return true;
                        },
                        success: function() {
                            ok(true, sSuccessMessage || "Click on CheckBox at position " + iPosition + ".");
                        },
                        errorMessage: sErrorMessage || "Not possible to click on CheckBox at position " + iPosition + "."
                    });
                },                

                iClickListItem: function(iPosition, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        searchOpenDialogs: true,
                        controlType: "sap.m.StandardListItem",
                        check: function(aListItem) {
                            new Press().executeOn(aListItem[iPosition]);
                            return true;
                        },
                        success: function() {
                            ok(true, sSuccessMessage || "Click on StandardListItem of position " + iPosition + ".");
                        },
                        errorMessage: sErrorMessage || "Not possible to click on StandardListItem of position " + iPosition + "."
                    });
                },

                iWaitFilterToBeApplied: function(sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.StandardListItem",
                        matchers: [new sap.ui.test.matchers.PropertyStrictEquals({
                            name: "icon",
                            value: "sap-icon://employee"
                        })],
                        check: function(aCalendarRowHeader) {
                            this.listItemLength = this.listItemLength || aCalendarRowHeader.length;
                            this.fistEmployee = this.fistEmployee || aCalendarRowHeader[0].getTitle();
                            if (this.listItemLength !== aCalendarRowHeader.length ||
                                this.fistEmployee !== aCalendarRowHeader[0].getTitle()) {
                                this.listItemLength = undefined;
                                this.fistEmployee = undefined;
                                return true;
                            }
                            return false;
                        },
                        success: function(aInputs) {
                            ok(true, sSuccessMessage || "The information in the table has changed.");
                        },
                        errorMessage: sErrorMessage || "The information in the table remains the same"
                    });
                },

                iSelectListItem: function(iPosition, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        searchOpenDialogs: true,
                        controlType: "sap.m.StandardListItem",
                        check: function(aInputs) {
                            aInputs[iPosition]._oMultiSelectControl.$().trigger("tap");
                            return true;
                        },
                        success: function() {
                            ok(true, sSuccessMessage || "Selected StandardListItem of position " + iPosition + ".");
                        },
                        errorMessage: sErrorMessage || "Not possible to select on StandardListItem of position " + iPosition + "."
                    });
                },

                iDeleteToken: function(sTextOfToken, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.Token",
                        check: function(aTokens) {
                            for (var i = aTokens.length - 1; i >= 0; i--) {
                                if (aTokens[i].getText() === sTextOfToken) {
                                    var oToken = aTokens[i];

                                    oToken.fireDelete({
                                        token: oToken
                                    });

                                    return true;
                                }
                            }
                        },
                        success: function() {
                            ok(true, sSuccessMessage || "Token " + sTextOfToken + " deleted");
                        },
                        errorMessage: sErrorMessage || "Not possible to delete token " + sTextOfToken + "."
                    });
                },

                iListIsReady: function(sIdOfList, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.List",
                        check: function(aList) {
                            for (var i = 0; i < aList.length; i++) {
                                if (aList[0].getId().indexOf(sIdOfList) > -1 && !aList[i].isBusy()) {
                                    return true;
                                }
                            }
                            return false;
                        },
                        success: function() {
                            ok(true, sSuccessMessage || "List " + sIdOfList + " ready.");
                        },
                        errorMessage: sErrorMessage || "List " + sIdOfList + " ready failed."
                    });
                },

                iTypeOnSearchField: function(sId, sText, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        searchOpenDialogs: true,
                        controlType: "sap.m.SearchField",
                        check: function(aSearchField) {
                            for (var i = 0; i < aSearchField.length; i++) {
                                if (aSearchField[i].getId().indexOf(sId) > -1) {
                                    aSearchField[i].setValue(sText);
                                    return true;
                                }
                            }
                        },
                        success: function() {
                            ok(true, sSuccessMessage || "Type " + sText + " in field " + sId + ".");
                        },
                        errorMessage: sErrorMessage || "Fail type " + sText + " in field " + sId + "."
                    });
                },

                iPressListItem: function(iPosition, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        searchOpenDialogs: true,
                        controlType: "sap.m.SelectList",
                        check: function(aSelectLists) {
                            aSelectLists[0].getItems()[iPosition].$().trigger("tap");
                            return true;

                        },
                        success: function() {
                            ok(true, sSuccessMessage || "Was abel to click ListItem at position " + iPosition);
                        },
                        errorMessage: sErrorMessage || "Was not abel to click ListItem at position " + iPosition
                    });
                }
            },

            assertions: {
                iShouldSeeAFilterBar: function(sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.ui.comp.filterbar.FilterBar",
                        success: function(oPlanningCalendar) {
                            Opa5.assert.ok(oPlanningCalendar, sSuccessMessage || "Found the Filter Bar.");
                        },
                        errorMessage: sErrorMessage || "Can't see the Filter Bar."
                    });
                },

                iShouldSeeButton: function(sId, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.Button",
                        success: function(aButtons) {
                            for (var i = aButtons.length - 1; i >= 0; i--) {
                                if (aButtons[i].getId().indexOf(sId) > -1) {
                                    Opa5.assert.ok(aButtons, sSuccessMessage || "Found the button " + sId + ".");
                                    return true;
                                }
                            }
                            return false;
                        },
                        errorMessage: sErrorMessage || "Can't see the button " + sId + "."
                    });
                },

                iShouldSeeADialog: function(sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.Dialog",
                        success: function(oDialog) {
                            Opa5.assert.ok(oDialog, sSuccessMessage || "Found the dialog.");
                        },
                        errorMessage: sErrorMessage || "Can't see the dialog."
                    });
                },

                iShouldSeeToken: function(sIdOfTextField, sTokenText, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.MultiInput",
                        success: function(aInputs) {
                            var aTokens, sText;
                            for (var i = 0; i < aInputs.length; i++) {
                                if (aInputs[i].getId().indexOf(sIdOfTextField) > -1) {
                                    aTokens = aInputs[i].getTokens();
                                    for (var j = aTokens.length - 1; j >= 0; j--) {
                                        sText = aTokens[i].getText();
                                        if (sText === sTokenText) {
                                            break;
                                        }
                                    }
                                    Opa5.assert.equal(sText, sTokenText, sSuccessMessage || "Found token " + sTokenText + " in field " + sIdOfTextField + ".");
                                    break;
                                }
                            }
                        },
                        errorMessage: sErrorMessage || "No MultiInput found."
                    });
                },

                iShouldSeeNTokens: function(sIdOfTextField, iAmountOfTokens, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.MultiInput",
                        success: function(aInputs) {
                            for (var i = 0; i < aInputs.length; i++) {
                                if (aInputs[i].getId().indexOf(sIdOfTextField) > -1) {
                                    Opa5.assert.equal(aInputs[i].getTokens().length, iAmountOfTokens, sSuccessMessage || "Found expected amount of tokens in field " + sIdOfTextField + ".");
                                    break;
                                }
                            }
                        },
                        errorMessage: sErrorMessage || "No MultiInput found."
                    });
                },

                iShouldSeeNItemsCheckedInList: function(sIdOfList, iExpectedAmountOfSelected, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.List",
                        success: function(aList) {
                            for (var i = 0; i < aList.length; i++) {
                                if (aList[i].getId().indexOf(sIdOfList) > -1) {
                                    Opa5.assert.equal(aList[i].getSelectedItems().length, iExpectedAmountOfSelected, sSuccessMessage || "Found expected amount of selected items in list " + sIdOfList + ".");
                                    break;
                                }
                            }
                        },
                        errorMessage: sErrorMessage || "List " + sIdOfList + " not found."
                    });
                },

                iShouldSeeItemDeselectedInList: function(sIdOfList, sTextOfListItem, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.List",
                        success: function(aList) {
                            for (var i = 0; i < aList.length; i++) {
                                if (aList[i].getId().indexOf(sIdOfList) > -1) {
                                    var itemFound = aList[i].getSelectedItems().find(
                                        function(item) {
                                            return item.getTitle() === sTextOfListItem;
                                        }
                                    );
                                    Opa5.assert.notOk(itemFound, sSuccessMessage || "Item " + sTextOfListItem + " deselected in list " + sIdOfList + ".");
                                    break;
                                }
                            }
                        },
                        errorMessage: sErrorMessage || "List " + sIdOfList + " not found."
                    });
                },

                iShouldSeeItemSelectedInList: function(sIdOfList, sTextOfListItem, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.List",
                        success: function(aList) {
                            for (var i = 0; i < aList.length; i++) {
                                if (aList[i].getId().indexOf(sIdOfList) > -1) {
                                    var itemFound = aList[i].getSelectedItems().find(
                                        function(item) {
                                            return item.getTitle() === sTextOfListItem;
                                        }
                                    );

                                    Opa5.assert.ok(itemFound, sSuccessMessage || "Item " + sTextOfListItem + " selected in list " + sIdOfList + ".");
                                    break;
                                }
                            }
                        },
                        errorMessage: sErrorMessage || "List " + sIdOfList + " not found."
                    });
                },

                iShouldSeeLableWithValue: function(sLabelText, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.Label",
                        check: function(aInputs) {
                            for (var i = 0; i < aInputs.length; i++) {
                                if (aInputs[i].getText() === sLabelText) {
                                    return true;
                                }
                            }
                        },
                        success: function(aInputs) {
                            Opa5.assert.ok(aInputs, sSuccessMessage || "Found lable with text: " + sLabelText);
                        },
                        errorMessage: sErrorMessage || "Could not find lable with text: " + sLabelText
                    });
                },

                iShouldSeeValueInMultiInput: function(sMultiInputId, sTokenValue, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.MultiInput",
                        check: function(aMultiInputs) {
                            for (var i = 0; i < aMultiInputs.length; i++) {
                                if (aMultiInputs[i].getId().indexOf(sMultiInputId) > -1) {
                                    if (aMultiInputs[i].getTokens().length === 0) continue;
                                    if (aMultiInputs[i].getTokens()[0].getText() === sTokenValue) {
                                        return true;
                                    }
                                }
                            }
                        },
                        success: function(aInputs) {
                            Opa5.assert.ok(aInputs, sSuccessMessage || "Could see Multi input with token value: " + sTokenValue);
                        },
                        errorMessage: sErrorMessage || "Could not see Multi input with token value: " + sTokenValue
                    });
                },

                iShouldSeeNoTokensInMultiInput: function(sMultiInputId, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.MultiInput",
                        check: function(aMultiInputs) {
                            for (var i = 0; i < aMultiInputs.length; i++) {
                                if (aMultiInputs[i].getId().indexOf(sMultiInputId) > -1) {
                                    if (aMultiInputs[i].getTokens().length === 0) return true;
                                }
                            }
                        },
                        success: function(aInputs) {
                            Opa5.assert.ok(aInputs, sSuccessMessage || "There where no tokens in the Multi input with the id: " + sMultiInputId);
                        },
                        errorMessage: sErrorMessage || "There where tokens in the Multi input with the id: " + sMultiInputId
                    });
                },

                iShouldSeePersonInCalendar: function(sEmployeeName, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.StandardListItem",
                        matchers: [new sap.ui.test.matchers.PropertyStrictEquals({
                            name: "icon",
                            value: "sap-icon://employee"
                        })],
                        check: function(aCalendarRowHeader) {
                            for (var i = 0; i < aCalendarRowHeader.length; i++) {
                                if (aCalendarRowHeader[i].getTitle().indexOf(sEmployeeName) > -1) {
                                    return true;
                                }
                            }
                        },
                        success: function(aInputs) {
                            Opa5.assert.ok(aInputs, sSuccessMessage || "The employee " + sEmployeeName + " was found.");
                        },
                        errorMessage: sErrorMessage || "The employee " + sEmployeeName + " was not found."
                    });
                },

                iShouldNotSeePersonInCalendar: function(sEmployeeName, sSuccessMessage, sErrorMessage) {
                    return this.waitFor({
                        controlType: "sap.m.StandardListItem",
                        matchers: [new sap.ui.test.matchers.PropertyStrictEquals({
                            name: "icon",
                            value: "sap-icon://employee"
                        })],
                        check: function(aCalendarRowHeader) {
                            for (var i = 0; i < aCalendarRowHeader.length; i++) {
                                if (aCalendarRowHeader[i].getTitle().indexOf(sEmployeeName) > -1) {
                                    return false;
                                }
                            }
                            return true;
                        },
                        success: function(aInputs) {
                            Opa5.assert.ok(aInputs, sSuccessMessage || "The employee " + sEmployeeName + " was not found.");
                        },
                        errorMessage: sErrorMessage || "The employee " + sEmployeeName + " was found."
                    });
                },

                okAssert: function(sMessage) {
                    Opa5.assert.ok(true, sMessage || "ok assert");
                }
            }
        }
    });
});
