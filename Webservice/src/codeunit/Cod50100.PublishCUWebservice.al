codeunit 50100 "Publish CU Webservice"
{
    /// <summary>
    /// Test API in Postman
    /// Publish this code and go to Web Services page and create new then choose this codeunit
    /// Put the link below in postman to test your web service that was published
    /// {hostname}/{server_instance_name}/ODataV4/{serviceName}_{procedureName}?company={companyName|companyId}
    /// http://localhost:7048/BC250/ODataV4/WEBSERVICE_TestAPI?company=CRONUS%20International%20Ltd.
    /// This link is called in the API
    /// </summary>
    [ServiceEnabled]
    procedure TestAPI(username: Text; email: Text; fullname: Text) Result: Text
    var
        UserAPITable: Record "User API";
    begin
        UserAPITable.Init();
        UserAPITable.username := username;
        UserAPITable.email := email;
        UserAPITable.fullname := fullname;
        UserAPITable.Insert();
        Result := username + email + fullname;
    end;
    
    /// <summary>
    /// Get the data from API by clicking a button manually
    /// </summary>
    procedure GetDataFromAPI()
    var
        UserAPITable: Record "User API";
        JSONArray: JsonArray;  // The array we expect
        JSONObject: JsonObject; // Each individual user object
        JSONValue: JsonValue;  // Holds values of the keys
        I: Integer;
        JSONToken: JsonToken;
        Response: JsonToken;
        ResponseObject: JsonObject;  // Holds the full response JSON
        ID: Integer;
    begin
        // Fetch data from API using GET method
        GetJSONData(
            HttpMethodGet,
            Url,
            JSONToken,
            '',
            '',
            '',
            '',
            true,
            Response
        );

        // Check for HTTP success
        if (not IsLastHttpSuccess()) then
            Error(ErrRequestError, GetLastHttpStatusCode(), GetLastHttpReasonPhrase());

        // Convert the response into a JSON object
        ResponseObject := Response.AsObject();

        // This is the format of data that is returned from API
        //    {
        //     "statusCode":200,
        //     "data":[
        //         {
        //             "User Id": "676be667601aa091f74e7161",
        //             "username":"one",
        //             "email":"one@gmail.com",
        //             "fullName":"one",
        //             "avatar":"http://res.cloudinary.com/dxvvcwci1/image/upload/v1735124580/lm815hch6n9umgeyn9ai.png",
        //             "coverImage":"http://res.cloudinary.com/dxvvcwci1/image/upload/v1735124583/xyxdn3bjiwclw8bs5wkm.png",
        //             "watchHistory":[],
        //             "password":"12345678",
        //             "createdAt":"2024-12-25T11:03:03.333Z",
        //             "updatedAt":"2024-12-25T11:03:03.333Z",
        //             "__v":0
        //             },
        //             {
        //                 "_id":"676bf10df662e4bfd8ca1cb6",
        //                 "username":"opio",
        //                 "email":"opio@gmail.com",
        //                 "fullname":"opio",
        //                 "avatar":"http://res.cloudinary.com/dxvvcwci1/image/upload/v1735127306/muuerldoba8yfyfiiayw.png",
        //                 "coverImage":"http://res.cloudinary.com/dxvvcwci1/image/upload/v1735127309/khageewm7hozx9nzobxk.png",
        //                 "watchHistory":[],
        //                 "password":"12345678",
        //                 "createdAt":"2024-12-25T11:48:29.426Z",
        //                 "updatedAt":"2024-12-25T11:48:29.426Z",
        //                 "__v":0
        //                 }
        //             ],
        //             "message":"Available Users",
        //             "success":true
        //     }

        // Extract the 'data' field from the response
        if ResponseObject.Get('data', JSONToken) then begin
            // Check if 'data' is an array
            if JSONToken.IsArray then begin
                JSONArray := JSONToken.AsArray();

                // Iterate over the array (list of users)
                for I := 0 to JSONArray.Count - 1 do begin
                    JSONArray.Get(I, JSONToken);

                    if JSONToken.IsObject then begin
                        // Convert JSONToken to JSONObject
                        JSONObject := JSONToken.AsObject();
                        UserAPITable.Init();
                        UserAPITable."User Id" := GetNextIdNo(UserAPITable);

                        // Retrieve user details from each JSON object
                        if "Get Result JSON Value"(JSONObject, 'username', JSONValue) then
                            UserAPITable.username := JSONValue.AsText();

                        if "Get Result JSON Value"(JSONObject, 'email', JSONValue) then
                            UserAPITable.email := JSONValue.AsText();

                        if "Get Result JSON Value"(JSONObject, 'fullname', JSONValue) then
                            UserAPITable.fullname := JSONValue.AsText();

                        // Insert the new record into the table
                        UserAPITable.Insert();
                    end;
                end;
            end;
        end;
    end;

    // Utility function to safely get JSON values
    local procedure "Get Result JSON Value"(JObject: JsonObject; KeyName: Text; var JValue: JsonValue): Boolean
    var
        JToken: JsonToken;
    begin
        if not JObject.Get(KeyName, JToken) then exit;
        JValue := JToken.AsValue();
        exit(true);
    end;

    local procedure GetNextIdNo(UserAPITable: Record "User API") id: Integer
    begin
        UserAPITable.Reset();
        if UserAPITable.FindLast() then
            exit(UserAPITable."User Id" + 1)
        else
            exit(1);
    end;

    /// <summary>
    /// Handle Errors
    /// </summary>
    /// <param name="Method"></param>
    /// <param name="Url"></param>
    /// <param name="RequestBody"></param>
    /// <param name="Authorization"></param>
    /// <param name="UserName"></param>
    /// <param name="Password"></param>
    /// <param name="Token"></param>
    /// <param name="ExpectResponseBody"></param>
    /// <param name="Response"></param>
    /// <returns></returns>
    [TryFunction]
    local procedure GetJSONData(Method: Text; Url: Text[255]; RequestBody: JsonToken; Authorization: Text; UserName: Text[50]; Password: Text[50]; Token: Text[255]; ExpectResponseBody: Boolean; var Response: JsonToken)
    var
        RequestBodyIsEmpty: Boolean;
        ContentText: Text;
        RequestMessage: HttpRequestMessage;
        ReponseInStream: InStream;
        TempBlob: Codeunit "Temp Blob";
    begin
        RequestBodyIsEmpty := true;
        if RequestBody.IsObject() then
            RequestBodyIsEmpty := RequestBody.AsObject().Keys.Count = 0
        else
            if RequestBody.IsValue() then
                RequestBodyIsEmpty := RequestBody.AsValue().IsNull
            else
                if RequestBody.IsArray() then
                    RequestBodyIsEmpty := RequestBody.AsArray().Count = 0;

        if not RequestBodyIsEmpty then begin
            RequestBody.WriteTo(ContentText);
        end;

        if ExpectResponseBody then
            TempBlob.CreateInStream(ReponseInStream);

        RequestJSONData(Method, Url, ContentTypeApplicationJson, ContentText, Authorization, UserName, Password, Token, ExpectResponseBody, ContentTypeApplicationJson, ReponseInStream);

        if LastHttpSuccess and ExpectResponseBody then
            Response.ReadFrom(ReponseInStream);
    end;

    /// <summary>
    /// Request for Data
    /// </summary>
    /// <param name="Method"></param>
    /// <param name="Url"></param>
    /// <param name="ContentType"></param>
    /// <param name="RequestBody"></param>
    /// <param name="Authorization"></param>
    /// <param name="UserName"></param>
    /// <param name="Password"></param>
    /// <param name="Token"></param>
    /// <param name="ExpectResponseBody"></param>
    /// <param name="Accept"></param>
    /// <param name="ReponseInStream"></param>
    /// <returns></returns>
    [TryFunction]
    local procedure RequestJSONData(Method: Text; Url: Text[255]; ContentType: Text; RequestBody: Text; Authorization: Text; UserName: Text[50]; Password: Text[50]; Token: Text[255]; ExpectResponseBody: Boolean; Accept: Text; var ReponseInStream: InStream)
    var
        Client: HttpClient;
        RequestHeaders: HttpHeaders;
        ContentHeaders: HttpHeaders;
        RequestMessage: HttpRequestMessage;
        ResponseMessage: HttpResponseMessage;
        AuthText: Text;
        Base64Convert: Codeunit "Base64 Convert";
        ResponseHeaders: HttpHeaders;
    begin
        RequestMessage.SetRequestUri(Url);
        RequestMessage.Method(Method);

        RequestMessage.GetHeaders(RequestHeaders);
        RequestHeaders.Add('User-Agent', 'Dynamics 365 Business Central');
        case Authorization of
            '':
                ;
            AuthorizationBasic:
                begin
                    if (UserName = '') or (Password = '') then
                        Error(ErrMissingBasicAuthUserNameOrPassword);

                    AuthText := StrSubstNo('%1:%2', UserName, Password);
                    RequestHeaders.Add('Authorization', StrSubstNo('Basic %1', Base64Convert.ToBase64(AuthText)));
                end;
            AuthorizationBearer:
                begin
                    if Token = '' then
                        Error(MissingBearerAuthToken);

                    RequestHeaders.Add('Authorization', StrSubstNo('Bearer %1', Token));
                end;
            AuthorizationApp:
                begin
                    if Token = '' then
                        Error(MissingBearerAuthToken);

                    RequestHeaders.Add('Authorization', StrSubstNo('App %1', Token));
                end;
        end;

        if RequestBody <> '' then begin
            RequestMessage.Content.WriteFrom(RequestBody);

            RequestMessage.Content.GetHeaders(ContentHeaders);

            if ContentType <> '' then begin
                if ContentHeaders.Contains('Content-Type') then
                    ContentHeaders.Remove('Content-Type');

                ContentHeaders.Add('Content-Type', ContentType);
            end;
        end;

        if ExpectResponseBody then begin
            ResponseHeaders := ResponseMessage.Headers();
            if Accept <> '' then begin
                if ResponseHeaders.Contains('Accept') then
                    ResponseHeaders.Remove('Accept');

                ResponseHeaders.Add('Accept', Accept);
            end;
        end;

        Client.Send(RequestMessage, ResponseMessage);
        if (ResponseMessage.IsSuccessStatusCode) then begin
            LastHttpSuccess := true;
            ResponseHeaders := ResponseMessage.Headers;
            if ExpectResponseBody then
                ResponseMessage.Content.ReadAs(ReponseInStream);
        end else begin
            LastHttpSuccess := false;
            LastHttpStatusCode := ResponseMessage.HttpStatusCode;
            LastHttpReasonPhrase := ResponseMessage.ReasonPhrase;
            LastHttpIsBlockedByEnvironment := ResponseMessage.IsBlockedByEnvironment();
        end;
    end;

    local procedure IsLastHttpSuccess(): Boolean
    begin
        exit(LastHttpSuccess);
    end;

    local procedure GetLastHttpStatusCode(): Integer
    begin
        exit(LastHttpStatusCode)
    end;

    local procedure GetLastHttpReasonPhrase(): Text
    begin
        exit(LastHttpReasonPhrase)
    end;

    local procedure GetLastIsBlockedByEnvironment(): Boolean
    begin
        exit(LastHttpIsBlockedByEnvironment)
    end;

    var
        Url: Label 'http://localhost:7000/api/v1/users';

        LastHttpSuccess: Boolean;
        LastHttpStatusCode: Integer;
        LastHttpReasonPhrase: Text;
        LastHttpIsBlockedByEnvironment: Boolean;
        ErrMissingBasicAuthUserNameOrPassword: Label 'Username or Password for Basic Authorization not specified';
        MissingBearerAuthToken: Label 'Token Bearer Authorization not specified';

        //Authorization and Headers
        ContentTypeApplicationJson: Label 'application/json';
        HttpMethodGet: Label 'GET';
        AuthorizationBasic: Label 'Basic';
        AuthorizationBearer: Label 'Bearer';
        AuthorizationApp: Label 'App';

        ErrRequestError: Label 'Web Service Request Error: %1 - %2', Comment = '%1 = Http Status Code, %2 = Http Status Description';
        SuccessMessage: Label 'Web Service Success';
}
