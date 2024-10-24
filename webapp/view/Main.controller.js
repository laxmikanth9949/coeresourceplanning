sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/coe/capacity/reuselib/controls/TimeZoneSelect/TimeZoneSettings",
	"sap/coe/capacity/reuselib/controls/ResourcePlanningCalendar/ResourcePlanningCalendarComponent"
], function(Controller, TimeZoneSettings, ResourcePlanningCalendarComponent) {
    "use strict";

    return Controller.extend("sap.coe.rpa.view.Main", {

	onInit: function() {
		if (sap.ui.Device.support.touch === false) {
			this.getView().addStyleClass("sapUiSizeCompact");
		}
		this.oRouter = this.getOwnerComponent().getRouter();
	//	TimeZoneSettings._setTimeZoneModelToView(this, "sap.coe.capacity.reuselib");
		ResourcePlanningCalendarComponent.prototype._setTimeZoneModelToView(this, "sap.coe.capacity.reuselib");
		sap.ui.getCore().getConfiguration().getFormatSettings().setFirstDayOfWeek(1);
	},

	onBeforeRendering: function(){
		// Shell not loading in cFLP due to the tomezone button added into Resource planning calender component fragment and implemented further
		// commented Timezone navigation code here and navigated to Resource Planning Calendar component
	//	TimeZoneSettings._setAppSettingButtons(this);
	//	TimeZoneSettings._getUserTimeZone(this);
		ResourcePlanningCalendarComponent.prototype._getUserTimeZone(this);
		ResourcePlanningCalendarComponent.prototype._TimezoneSettingsDialog(this);
		ResourcePlanningCalendarComponent.prototype._getUserTimeZone(this);
	}

    });

});