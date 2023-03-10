# Customizing Models

You can change the models used by Venture internally by defining your own model
and extending the corresponding Venture model:

```php
use Sassnowski\Venture\Models\Workflow as VentureWorkflow;

class Workflow extends VentureWorkflow
{
    // ...
}
```

After defining your model, you can instruct Venture to use your custom model via
the `Sassnowski\Venture\Venture` class. The best place to do so is in the `boot`
method of one of your application’s service provider classes:

```php
use App\Models\Venture\Workflow;
use App\Models\Venture\WorkflowJob;
use Sassnowski\Venture\Venture;

/**
 * Bootstrap any application services.
 */
public function boot(): void
{
    Venture::useWorkflowModel(Workflow::class);
    Venture::useWorkflowJobModel(WorkflowJob::class);
}
```
