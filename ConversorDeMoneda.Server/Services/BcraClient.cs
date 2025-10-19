using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;

namespace ConversorDeMoneda.Server.Services
{
    public record BcraPoint(DateTime d, decimal v);

    public interface IBcraClient
    {
        Task<(DateTime date, decimal value)> GetUsdOficialAsync(CancellationToken ct = default);
        Task<(DateTime date, decimal value)> GetUsdAsync(string serie, CancellationToken ct = default);
    }

    public class BcraClient : IBcraClient
    {
        private readonly HttpClient _http;
        private readonly string _token;
        private readonly JsonSerializerOptions _json = new(JsonSerializerDefaults.Web);

        public BcraClient(HttpClient http, IConfiguration cfg)
        {
            _http = http;
            _http.BaseAddress = new Uri(cfg["Bcra:BaseUrl"] ?? "https://api.estadisticasbcra.com");
            _token = cfg["Bcra:Token"] ?? Environment.GetEnvironmentVariable("BCRA__TOKEN") ?? "";
        }

        public Task<(DateTime date, decimal value)> GetUsdOficialAsync(CancellationToken ct = default)
            => GetUsdAsync("usd_of", ct);

        public async Task<(DateTime date, decimal value)> GetUsdAsync(string serie, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(_token))
                throw new BcraException("Falta el token del BCRA (Bcra:Token / BCRA__TOKEN).", (int)HttpStatusCode.Unauthorized);

            // Mapea la serie a la ruta correcta
            var path = serie switch
            {
                "usd_of" => "/usd_of",
                "usd_of_minorista" => "/usd_of_minorista",
                _ => "/usd_of"
            };

            using var req = new HttpRequestMessage(HttpMethod.Get, path);
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
            req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            using var res = await _http.SendAsync(req, ct);
            var body = await res.Content.ReadAsStringAsync(ct);

            if (res.StatusCode is HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden)
                throw new BcraException($"BCRA rechazó el token ({(int)res.StatusCode}). Verifica que el JWT sea válido y no esté vencido.", (int)res.StatusCode, body);

            if (!res.IsSuccessStatusCode)
                throw new BcraException($"Error BCRA {(int)res.StatusCode}: {res.ReasonPhrase}", (int)res.StatusCode, body);

            var series = JsonSerializer.Deserialize<List<BcraPoint>>(body, _json) ?? new();
            if (series.Count == 0)
                throw new BcraException($"La serie {serie} vino vacía.", 502, body);

            var last = series[^1];
            return (last.d, last.v);
        }
    }
}
