using System;
using System.Net;
using System.Threading;
using System.Threading.Tasks;

using Application.Errors;

using FluentValidation;

using MediatR;

using Persistence;

namespace Application.Activities
{
	public class Edit
	{
		public class Command : IRequest
		{
			public Guid Id { get; set; }
			public string Title { get; set; }
			public string Description { get; set; }
			public string Category { get; set; }
			public DateTime? Date { get; set; }
			public string City { get; set; }
			public string Venue { get; set; }
		}

		public class Handler : IRequestHandler<Command>
		{
			private readonly DataContext _context;

			public Handler(DataContext context)
			{
				_context = context;
			}

			public class CommandValidator : AbstractValidator<Command>
			{
				public CommandValidator()
				{
					RuleFor(a => a.Title).NotEmpty();
					RuleFor(a => a.Description).NotEmpty();
					RuleFor(a => a.Category).NotEmpty();
					RuleFor(a => a.Date).NotEmpty();
					RuleFor(a => a.City).NotEmpty();
					RuleFor(a => a.Venue).NotEmpty();
				}
			}

			public async Task<Unit> Handle(Command request, CancellationToken cancellationToken)
			{
				var activity = await _context.Activities.FindAsync(request.Id);

				if (activity == null)
					throw new RestException(HttpStatusCode.NotFound, new { activity = "Not found" });

				// Temporarily, will add a mapper later.
				activity.Title = request.Title ?? activity.Title;
				activity.Description = request.Description ?? activity.Description;
				activity.Category = request.Category ?? activity.Category;
				activity.Date = request.Date ?? activity.Date;
				activity.City = request.City ?? activity.City;
				activity.Venue = request.Venue ?? activity.Venue;

				var success = await _context.SaveChangesAsync() > 0;

				if (success)
					return Unit.Value;
				throw new Exception("Problem saving changes");
			}
		}
	}
}