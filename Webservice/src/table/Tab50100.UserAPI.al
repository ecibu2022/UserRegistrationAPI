table 50100 "User API"
{
    Caption = 'User API';
    DataClassification = ToBeClassified;

    fields
    {
        field(1; "User Id"; Integer)
        {
            Caption = 'User Id';
            DataClassification = CustomerContent;
            AutoIncrement = true;
        }
        field(2; username; Text[200])
        {
            Caption = 'username';
            DataClassification = CustomerContent;
        }
        field(3; email; Text[200])
        {
            Caption = 'email';
            DataClassification = CustomerContent;
        }
        field(4; fullname; Text[200])
        {
            Caption = 'fullname';
            DataClassification = CustomerContent;
        }
    }
    keys
    {
        key(PK; "User Id")
        {
            Clustered = true;
        }
    }
}
