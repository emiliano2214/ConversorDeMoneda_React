using ConversorDeMoneda.Server.Services;

namespace ConversorDeMoneda.Server
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // ?? Registrar cliente del BCRA
            builder.Services.AddHttpClient<IBcraClient, BcraClient>();

            var app = builder.Build();

            app.UseDefaultFiles();
            app.UseStaticFiles();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();
            app.UseAuthorization();

            app.MapControllers();

            // React SPA fallback
            app.MapFallbackToFile("/index.html");

            app.Run();
        }
    }
}
