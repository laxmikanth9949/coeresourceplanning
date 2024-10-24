sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/coe/capacity/reuselib/utils/i18n",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/Text"
], function(Controller, i18n, Button, Dialog,Text) {

    "use strict";

        return Controller.extend("sap.coe.capacity.reuselib.controls.ResourcePlanningCalendar.fragment.ColleagueDetailPopover.fragment", {

            onBeforeOpen: function(oEvent) {
                this.oFragment = this.getView();
                this.sFragmentId = this.oFragment.getParent().getId() + "--ColleagueDetails";
                this.oQualificationPanel = sap.ui.core.Fragment.byId(this.sFragmentId, "qualificationPanel");
                this.oSelectedUser = this.oFragment.getBindingContext().getProperty();

                var iQualificationsAmount = this.oFragment.getBindingContext().getProperty("QualificationSet/results").length;

                if (iQualificationsAmount === 0) {
                    this.oQualificationPanel.setVisible(false);
                } else {
                    this.oQualificationPanel.setVisible(true);
                }
            },

            onCreateAllocationPress: function(oEvent) {
                var oResourcePlanningCalendarComponent = this.oFragment.getParent();

                oResourcePlanningCalendarComponent.onOpenEditTimeAllocation(false, this.oSelectedUser);
            },
            openSpeakApp: function(){
                var sUrl = this.getView().getModel("UtilsModel").getProperty("/ExternalLinks/SpeakApp");
                window.open(sUrl);
            },

            //concats i18n strings to be displayed as message
            buildStringForMaintainQualMsg: function(){
                var sText = " ";
                sText += i18n.getText("MAINTAIN_QUAL_INFO_MSG_1");
                sText += i18n.getText("MAINTAIN_QUAL_INFO_MSG_2");
                sText += i18n.getText("MAINTAIN_QUAL_INFO_MSG_3");

                return sText;
            },

            onMaintainQualificationsPress : function() {

                var sText = this.buildStringForMaintainQualMsg();

                this.oDialog = new Dialog({
                    title: i18n.getText("MAINTAIN_QUAL_DIALOG_TITLE"),
                    type: "Message",
                    state: sap.ui.core.ValueState.Information,
                    content: new Text({
                        text: sText
                    }),
                    buttons: [
                        new Button({
                            text: i18n.getText("OPEN_SPEAK_APP_BUTTON"),
                            press: function () {
                                this.openSpeakApp();
                                this.oDialog.close();
                            }.bind(this)
                        }),
                        new Button({
                            text: i18n.getText("FRAGMENT_CREATEALLOCATION_BUTTON_CANCEL"),
                            press: function () {
                                this.oDialog.close();
                            }.bind(this)
                        })
                    ]
                });

                this.oDialog.open();
            }


        });
});
