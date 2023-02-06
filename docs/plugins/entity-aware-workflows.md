# Entity Aware Workflows Plugin

It can often be useful to associate workflows with models in your application. This would allow you to show all workflows belonging to the logged in user in you UI, for example.

Venture comes with an `EntityAwareWorkflows` plugin that adds this behavior.

## Activating the plugin

To activate the plugin, you may call `Venture::registerPlugin` inside your application’s service provider.

```php
<?php

use Illuminate\Support\ServiceProvider;
use Sassnowski\Venture\Venture;
use Sassnowski\Venture\Plugin\EntityAwareWorkflows;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        Venture::registerPlugin(
            EntityAwareWorkflows::class,
        );
    }
}
```

## Making workflows entity aware

Every workflow that should get associated with a model needs to implement the `EntityAwareWorkflow` interface.

```php
<?php

use App\Models\Podcast;
use Illuminate\Database\Eloquent\Model;
use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\Plugin\EntityAwareWorkflow;
use Sassnowski\Venture\WorkflowDefinition;

class PublishPodcastWorkflow extends AbstractWorkflow implements EntityAwareWorkflow
{
    public function __construct(private Podcast $podcast)
    {
    }

    public function definition(): WorkflowDefinition
    {
        // ...
    }

    public function getWorkflowable(): Model
    {
     	return $this->podcast->user;
    }
}
```

The `EntityAwareWorkflow` interface defines a single method `getWorkflowable`. This method should return the model that the workflow should get associated with.

Only workflows that implement this interface will get processed by the plugin.

## Accessing associated models

After starting a workflow that implements the `EntityAwareWorkflow` interface, you may access the associated model via the `workflowable` relationship.

```php
$workflow = PublishPodcastWorkflow::start($podcast);

$user = $workflow->workflowable;
```
