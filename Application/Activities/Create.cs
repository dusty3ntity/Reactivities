using System;
using System.Threading;
using System.Threading.Tasks;

using Domain;
using FluentValidation;
using MediatR;

using Persistence;

namespace Application.Activities
{
	public class Create
	{
		public class Command : IRequest
		{
			public Guid Id { get; set; } // Using client-side generated guid, but could return a created one.
			public string Title { get; set; }
			public string Description { get; set; }
			public string Category { get; set; }
			public DateTime Date { get; set; }
			public string City { get; set; }
			public string Venue { get; set; }
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

        public class Handler : IRequestHandler<Command>
		{
			private readonly DataContext _context;

			public Handler(DataContext context)
			{
				_context = context;
			}

			public async Task<Unit> Handle(Command request, CancellationToken cancellationToken)
			{
				var activity = new Activity
				{
					Id = request.Id,
						Title = request.Title,
						Description = request.Description,
						Category = request.Category,
						Date = request.Date,
						City = request.City,
						Venue = request.Venue
				};

				_context.Activities.Add(activity);
				var success = await _context.SaveChangesAsync() > 0; // Returns the number of changes done.

				if (success) 
					return Unit.Value;
				throw new Exception("Problem saving changes");
			}
		}
	}
}