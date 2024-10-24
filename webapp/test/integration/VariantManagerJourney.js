sap.ui.define([
    "sap/ui/test/opaQunit"
], function(opaTest) {
    "use strict";

    QUnit.module("Team Calendar Variant Manager");

    // Have to change the variant name after each run, because there are local copies of the variant
    // and they make the creation of a variant with the same name crash.
    var sVariantName = "NewVariant";

    opaTest("Should see the filter bar", function(Given, When, Then) {
        Given.iStartTheApp("teamCalendar");

        When.onTeamCalendarPage.Init();

        Then.onTeamCalendarPage.iShouldSeeAFilterBar();
    });

    //Variant load: name and fields
    opaTest("Should load the default variant from the server", function(Given, When, Then) {
        Then.onTeamCalendarPage.iShouldSeeLableWithValue("Default");
        Then.onTeamCalendarPage.iShouldSeeValueInMultiInput("idForOrgId", "COE Ireland HANA");
    });

    // create new variant:
    opaTest("Should See Employee Search Dialog", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressOnValueHelpRequestMultiInput("id___EmpId", "Open Employee Search Dialog successful", "Open Employee Search Dialog failed");

        Then.onTeamCalendarPage.iShouldSeeADialog();
    });

    opaTest("Search and select items on the Employee Search Dialog should create tokens.", function(Given, When, Then) {
        When.onTeamCalendarPage.iTypeOnSearchField("searchFieldEmpId", "I327678");
        When.onTeamCalendarPage.iPressButton("idForSearchButton", true, "Search button pressed", "Search button pressed failed");
        When.onTeamCalendarPage.iSelectListItem(0);
        When.onTeamCalendarPage.iPressButton("acceptForEmpId", true, "Ok button pressed", "Ok button pressed failed");

        Then.onTeamCalendarPage.iShouldSeeNTokens("id___EmpId", 1);
    });

    opaTest("Should be able to open the save variant dialog.", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressOnIcon("", "sap-icon://arrow-down");
        When.onTeamCalendarPage.iPressButton("saveas", true);

        Then.onTeamCalendarPage.iShouldSeeADialog();
    });

    opaTest("Should be able to save the variant.", function(Given, When, Then) {
        When.onTeamCalendarPage.iChangeInputValue("name", sVariantName);
        When.onTeamCalendarPage.iPressButton("variantsave", true);

        Then.onTeamCalendarPage.iShouldSeeLableWithValue("NewVariant");
    });

    // switch variants:
    opaTest("Should see a different selection of tokens after switching to the default variant.", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressOnIcon("", "sap-icon://action");
        When.onTeamCalendarPage.iPressOnIcon("", "sap-icon://arrow-down");
        When.onTeamCalendarPage.iPressListItem(2);
        Then.onTeamCalendarPage.iShouldSeeLableWithValue("Default");
        Then.onTeamCalendarPage.iShouldSeeNoTokensInMultiInput("idForEmpId");
    });

    opaTest("Should see a different selection of tokens after switching to the newly created variant.", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressOnIcon("", "sap-icon://action");
        When.onTeamCalendarPage.iPressOnIcon("", "sap-icon://arrow-down");
        When.onTeamCalendarPage.iPressListItem(0);
        Then.onTeamCalendarPage.iShouldSeeLableWithValue(sVariantName);
        Then.onTeamCalendarPage.iShouldSeeValueInMultiInput("idForEmpId", "Mr. Alfonso Blesa");
    });

    // delete variant again:
    opaTest("Should be able to open the manage variant dialog.", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressOnIcon("", "sap-icon://arrow-down");
        When.onTeamCalendarPage.iPressButton("manage", true);

        Then.onTeamCalendarPage.iShouldSeeADialog();
    });

    opaTest("Should be able to delete the variant.", function(Given, When, Then) {
        When.onTeamCalendarPage.iPressOnIcon("manage-del-2", "sap-icon://sys-cancel");
        When.onTeamCalendarPage.iPressButton("managementsave", true);
    });

    opaTest("Tear down and clean context", function(Given, When, Then) {
        Given.iTeardownMyAppFrame();

        Then.onTeamCalendarPage.okAssert("FilterBar context cleaned");
    });
});
