# Manipulating workflows before they get saved

[[toc]]

Sometimes you may want to modify a workflow before it gets saved to the database for the first time.

## The `beforeCreate` hook

If you want to apply a transformation to a specific workflow, you should implement the `beforeCreate` method in your workflow class.

```php{21-25}
<?php declare(strict_types=1);

use Sassnowski\Venture\Models\Workflow;
use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\WorkflowDefinition;

class PublishPodcastWorkflow extends AbstractWorkflow
{
    private Podcast $podcast;

    public function __construct(Podcast $podcast)
    {
        $this->podcast = $podcast;
    }

    public function definition(): WorkflowDefinition
    {
        // ...
    }

    public function beforeCreate(Workflow $workflow): void
    {
        // Perform some transformation to the workflow before it gets saved...
        $workflow->user_id = $this->podcast->user_id;
    }
}
```

The `beforeCreate` hook gets passed an instance of `Sassnowski\Venture\Models\Workflow`, which is a regular Eloquent model. As the name suggests, this hook is called before the workflow is persisted to the database for the first time. So the workflow model won't have an `id` yet.
