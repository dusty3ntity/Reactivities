using FluentValidation;

namespace Application.Validators
{
	public static class ValidatorExtensions
	{
		public static IRuleBuilder<T, string> Password<T>(this IRuleBuilder<T, string> ruleBuilder)
		{
			var options = ruleBuilder
				.NotEmpty()
				.MinimumLength(6).WithMessage("Password must be at least 6 characters")
				.Matches("[a-z]").WithMessage("Password must contain at least 1 lowercase letter")
				.Matches("[A-Z]").WithMessage("Password must contain at least 1 uppercase letter")
				.Matches("[0-9]").WithMessage("Password must contain at least 1 number")
				.Matches("[^a-zA-Z0-9]").WithMessage("Password must contain non alphanumeric characters");

			return options;
		}
	}
}