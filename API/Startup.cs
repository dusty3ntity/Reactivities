using Application.Activities;

using API.Middleware;

using FluentValidation.AspNetCore;

using MediatR;

using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

using Persistence;

namespace API
{
	public class Startup
	{
		public Startup(IConfiguration configuration)
		{
			Configuration = configuration;
		}

		public IConfiguration Configuration { get; }

		// This method gets called by the runtime. Use this method to add services to the container (dependency injection).
		public void ConfigureServices(IServiceCollection services)
		{
			services.AddDbContext<DataContext>(options =>
				options.UseSqlite(Configuration.GetConnectionString("DefaultConnection"))
			);
			services.AddCors(opt =>
			{
				opt.AddPolicy("CorsPolicy", policy =>
				{
					policy.AllowAnyHeader().AllowAnyMethod().WithOrigins("http://localhost:3000");
				});
			});
			// One of the Application class to provide the assembly of the Application project.
			services.AddMediatR(typeof(List).Assembly);
			services.AddControllers().AddFluentValidation(cfg =>
			{
				cfg.RegisterValidatorsFromAssemblyContaining<Create>(); // One of the classes to pick an assembly again.
			});
		}

		// This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
		public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
		{
			app.UseMiddleware<ErrorHandlingMiddleware>();

			if (env.IsDevelopment())
			{
				// app.UseDeveloperExceptionPage();
			}

			// Temporarily off, remember to add https://localhost:5001; url for listening https
			// app.UseHttpsRedirection();

			app.UseRouting();

			app.UseAuthorization();

			app.UseCors("CorsPolicy");

			app.UseEndpoints(endpoints =>
			{
				endpoints.MapControllers();
			});
		}
	}
}