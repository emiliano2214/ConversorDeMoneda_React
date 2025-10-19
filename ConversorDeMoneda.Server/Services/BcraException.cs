// ConversorDeMoneda.Server/Services/BcraException.cs
namespace ConversorDeMoneda.Server.Services;

public class BcraException : Exception
{
    public int StatusCode { get; }
    public string? ResponseBody { get; }

    public BcraException(string message, int statusCode, string? responseBody = null, Exception? inner = null)
        : base(message, inner)
    {
        StatusCode = statusCode;
        ResponseBody = responseBody;
    }
}
