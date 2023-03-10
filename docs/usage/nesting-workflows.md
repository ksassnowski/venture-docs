# Nesting Workflows

As your application grows, you might want to extract a subset of jobs into a
separate workflow so that you can re-use them inside other workflows. Just like
you can add individual jobs, you can embed an entire other workflow inside your
workflow.

## Adding a nested workflow

To add a workflow to another workflow, you can use the `addWorkflow` method on
the definition instance.

```php{17}
<?php

namespace App\Workflows;

use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\WorkflowDefinition;

class PublishPodcastWorkflow extends AbstractWorkflow
{
 	public function __construct(private Podcast $podcast)
 	{
 	}

    public function definition(): WorkflowDefinition
    {
        return $this->define('Publish Podcast')
            ->addWorkflow(new OptimizePodcastWorkflow($this->podcast));
    }
}
```

### Adding a nested workflow with dependencies

Just like regular jobs inside a workflow, nested workflows can also depend on
other jobs to finish first.

```php
<?php

namespace App\Workflows;

use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\WorkflowDefinition;

class PodcastWorkflow extends AbstractWorkflow
{
    public function definition(): WorkflowDefinition
    {
        return $this->define('Podcast Workflow')
            ->addJob(new ProcessPodcast($this->podcast))
            ->addWorkflow(new EncodePodcastWorkflow($this->podcast), [
                ProcessPodcast::class,
            ]);
    }
}
```

This brings up an interesting question. What exactly does it mean for a
_workflow_ to depend on a job? This is easier to visualize than to describe in
words, so here's what the resulting workflow will look like:

<div style="text-align: center;">
    <img src="/connect-workflow-with-job.svg" />
</div>

Starting a workflow means starting all jobs that can be run in parallel. This is
why Venture connected all root nodes of the nested workflow with the job.

:::warning Note

The `EncodePodcastWorkflow` box in the diagram is only there for the sake of
demonstration. The outer workflow won't have any reference to a nested workflow.
It's as if you would have added all of the nested workflow's jobs individually.

:::

## Depending on a nested workflow

Just like a nested workflow can depend on a job, a job can depend on a nested
workflow.

```php
<?php

namespace App\Workflows;

use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\WorkflowDefinition;

class PodcastWorkflow extends AbstractWorkflow
{
    public function definition(): WorkflowDefinition
    {
        return $this->define('Podcast Workflow')
            ->addWorkflow(new ReleasePodcast($this->podcast))
            ->addJob(new NotifySubscribers($this->podcast), [
                ReleasePodcast::class,
            ]);
    }
}
```

A workflow is considered "finished" when there are no other jobs left to run. So
to model this, we can wait for all jobs to finish that don't have any further
dependant jobs. Here's what the above example looks like visually:

<div style="text-align: center;">
    <img src="/workflow-job-depends-on-workflow.svg" />
</div>

`NotifySubscribers` depends on the `ReleaseOnApplePodcasts` and
`ReleaseOnTransistorFM` of the nested `ReleasePodcastWorkflow`. This is because
once those two jobs are finished, the workflow is considered completed and any
dependant jobs can now be run.

### Workflows depending on other workflows

Finally, you can also have a nested workflow depend on another nested workflow.

```php
<?php

namespace App\Workflows;

use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\WorkflowDefinition;

class PodcastWorkflow extends AbstractWorkflow
{
    public function definition(): WorkflowDefinition
    {
        return $this->define('Podcast Workflow')
            ->addJob(new ProcessPodcast($this->podcast))
            ->addWorkflow(new EncodePodcastWorkflow($this->podcast), [
                ProcessPodcast::class,
            ])
            ->addWorkflow(new PublishPodcastWorkflow($this->podcast), [
                EncodePodcastWorkflow::class,
            ]);
    }
}
```

This would result in the following workflow.

<div style="text-align: center;">
    <img src="/workflow-depends-on-workflow.svg" />
</div>

While this looks complicated at first glance, it follows the same rules as the
other examples.

- A workflow depending on something means that each of the workflow's starting
  jobs have to depend on the same thing.
- Depending on a workflow means depending on its "final" jobs (i.e. jobs with no
  outgoing arrows)

Putting these two concepts together yields the above diagram. All of a
workflow's starting jobs have to depend on all of the other workflow's final
jobs.
