# Workflow lifecycle hooks

## The `beforeCreate` hook

Sometimes you may want to modify a workflow before it gets saved to the database for the first time. To do so, you may implement the `beforeCreate` method on your workflow class.

```php{18-21}
<?php declare(strict_types=1);

use Sassnowski\Venture\Models\Workflow;
use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\WorkflowDefinition;

class PublishPodcastWorkflow extends AbstractWorkflow
{
    public function __construct(private Podcast $podcast)
    {
    }

    public function definition(): WorkflowDefinition
    {
        // ...
    }

    public function beforeCreate(Workflow $workflow): void
    {
        $workflow->user_id = $this->podcast->user_id;
    }
}
```

The `beforeCreate` hook gets passed an instance of `Sassnowski\Venture\Models\Workflow`, which is a regular Eloquent model. As the name suggests, this hook is called before the workflow is persisted to the database for the first time. So the workflow model won't have an `id` yet.

## The `beforeNesting` hook

_todo_
