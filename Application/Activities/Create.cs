using System;
using System.Threading;
using System.Threading.Tasks;

using Application.Interfaces;

using Domain;

using FluentValidation;

using MediatR;

using Microsoft.EntityFrameworkCore;

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
			private readonly IUserAccessor _userAccessor;

			public Handler(DataContext context, IUserAccessor userAccessor)
			{
				_context = context;
				_userAccessor = userAccessor;
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

				var user = await _context.Users.SingleOrDefaultAsync(x => x.UserName == _userAccessor.GetCurrentUsername());

				var attendee = new UserActivity
				{
					AppUser = user,
						Activity = activity,
						IsHost = true,
						DateJoined = DateTime.Now
				};

				_context.Activities.Add(activity);
				_context.UserActivities.Add(attendee);
				var success = await _context.SaveChangesAsync() > 0; // Returns the number of changes done.

				if (success)
					return Unit.Value;
				throw new Exception("Problem saving changes");
			}
		}
	}
}