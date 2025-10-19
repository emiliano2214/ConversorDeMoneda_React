using ConversorDeMoneda.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace ConversorDeMoneda.Server.Controllers
{
    [ApiController]
    [Route("api/bcra")]
    public class BcraController : ControllerBase
    {
        private readonly IBcraClient _bcra;
        private readonly ILogger<BcraController> _logger;

        public BcraController(IBcraClient bcra, ILogger<BcraController> logger)
        {
            _bcra = bcra;
            _logger = logger;
        }

        // Mayorista (compat)
        [HttpGet("usd-oficial")]
        public async Task<IActionResult> GetUsdOficial(CancellationToken ct)
        {
            try
            {
                var (date, value) = await _bcra.GetUsdOficialAsync(ct);
                return Ok(new { date = date.ToString("yyyy-MM-dd"), value });
            }
            catch (BcraException ex)
            {
                _logger.LogWarning("BCRA {Status}: {Msg}", ex.StatusCode, ex.Message);
                return StatusCode(ex.StatusCode, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado llamando a BCRA (usd-oficial)");
                return StatusCode(500, new { error = "Error interno llamando a BCRA" });
            }
        }

        // Genérico: ?serie=usd_of | usd_of_minorista
        [HttpGet("usd")]
        public async Task<IActionResult> GetUsd([FromQuery] string? serie, CancellationToken ct)
        {
            try
            {
                var selected = (serie ?? "usd_of").Trim();
                var (date, value) = await _bcra.GetUsdAsync(selected, ct);
                return Ok(new { date = date.ToString("yyyy-MM-dd"), value, serie = selected });
            }
            catch (BcraException ex)
            {
                _logger.LogWarning("BCRA {Status}: {Msg}", ex.StatusCode, ex.Message);
                return StatusCode(ex.StatusCode, new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inesperado llamando a BCRA (usd)");
                return StatusCode(500, new { error = "Error interno llamando a BCRA" });
            }
        }
    }
}
