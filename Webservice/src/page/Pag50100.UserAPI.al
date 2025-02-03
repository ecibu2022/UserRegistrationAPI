page 50100 "User API"
{
    ApplicationArea = All;
    Caption = 'User API';
    PageType = List;
    SourceTable = "User API";
    UsageCategory = Lists;
    InsertAllowed = false;
    ModifyAllowed = false;
    // DeleteAllowed = false;
    LinksAllowed = false;

    layout
    {
        area(Content)
        {
            repeater(General)
            {
                field("User Id"; Rec."User Id")
                {
                    ToolTip = 'Specifies the value of the User Id field.', Comment = '%';
                }
                field(username; Rec.username)
                {
                    ToolTip = 'Specifies the value of the username field.', Comment = '%';
                }
                field(email; Rec.email)
                {
                    ToolTip = 'Specifies the value of the email field.', Comment = '%';
                }
                field(fullname; Rec.fullname)
                {
                    ToolTip = 'Specifies the value of the fullname field.', Comment = '%';
                }
            }
        }
    }

    actions
    {
        area(Processing)
        {
            action("Get Data From API")
            {
                ApplicationArea = All;
                PromotedCategory = Process;
                Promoted = true;
                PromotedIsBig = true;
                trigger OnAction()
                var
                    Webservice: Codeunit "Publish CU Webservice";
                begin
                    Webservice.GetDataFromAPI();
                end;
            }
        }
    }
}
