# Defining Workflows

Workflows are the main concept inside Venture. A workflow defines both the jobs
that belong to it as well as how these jobs are connected with each other. This
allows you to build up complex processes from simple building blocks.

## Creating workflows

Workflows are defined as classes that extend from `AbstractWorkflow`. The
`AbstractWorkflow` class defines an abstract method `definition` that you will
have to implement.

To continue with our example of publishing a podcast, let's create a workflow
called `PublishPodcastWorkflow`.

```php
use App\Podcast;
use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\WorkflowDefinition;

class PublishPodcastWorkflow extends AbstractWorkflow
{
    public function __construct(private Podcast $podcast)
    {
    }

    public function definition(): WorkflowDefinition
    {
        return $this->define('Publish new podcast');
    }
}
```

The `define` method accepts the name of the workflow and returns an empty
`WorkflowDefinition` object. Since a workflow without any jobs isn’t very
useful, let’s look at how to add jobs next.

## Adding jobs to a workflow

To add a job to a workflow, you may call the `addJob` method on the definition
instance.

```php
$this->define('Publish new podcast')
    ->addJob(new ProcessPodcast($this->podcast));
```

Venture provides a fluent interface to define workflows, so you can simply keep
chaining method calls to build up your workflow.

```php
$this->define('Publish new podcast')
    ->addJob(new ProcessPodcast($this->podcast))
    ->addJob(new OptimizePodcast($this->podcast));
```

In this example, we have added two jobs to the workflow. Since we haven’t
defined any dependencies for these jobs, both of them would be started in
parallel when you start the workflow.

### Jobs with dependencies

Venture really starts to shine once you start adding jobs that have
dependencies.

To define a job's dependencies, you may pass in an array of class names as the
second parameter to the `addJob` method.

```php{4-7}
$this->define('Publish new podcast')
    ->addJob(new ProcessPodcast($this->podcast))
    ->addJob(new OptimizePodcast($this->podcast))
    ->addJob(new PublishPodcastOnTransistorFM($this->podcast), [
        ProcessPodcast::class,
        OptimizePodcast::class
    ]);
```

In this example, you're telling Venture that the `PublishPodcastOnTransistorFM`
job can only run once both `ProcessPodcast` and `OptimizePodcast` have finished.

The workflow we have configured so far would look like this.

<div style="text-align: center;">
    <img src="/workflow-3.svg" />
</div>

From this point, you can keep adding jobs to the workflow and it will keep track
of all dependencies. All you need to do is to define a job's direct
dependencies.

```php
$this->define('Publish new podcast')
    ->addJob(new ProcessPodcast($this->podcast))
    ->addJob(new OptimizePodcast($this->podcast))
    ->addJob(new PublishPodcastOnTransistorFM($this->podcast), [
        ProcessPodcast::class,
        OptimizePodcast::class
    ])
    ->addJob(new PublishPodcastOnApplePodcasts($this->podcast), [
        ProcessPodcast::class,
        OptimizePodcast::class
    ])
    ->addJob(new CreateAudioTranscription($this->podcast), [
        ProcessPodcast::class,
    ])
    ->addJob(new TranslateAudioTranscription($this->podcast), [
        CreateAudioTranscription::class,
    ]);
```

<div style="text-align: center;">
    <img src="/workflow-4.svg" />
</div>

::: details Direct and transitive dependencies If we look at the diagram above,
`TranslateAudioTranscription` has a _direct_ dependency on
`CreateAudioTranscription`. `CreateAudioTranscription` in turn has a dependency
on `ProccessPodcast`. This makes `ProcessPodcast` a _transitive_ dependency of
`TranslateAudioTranscription` (think dependency of a dependency).

You don't have to worry about how exactly a job fits into a workflow, however.
All you need to know is what other jobs a job _directly depends_ on and Venture
will figure out the rest. :::

::: tip Multiple instances of the same job Since you specify the dependencies of
a job by using class names, you might be wondering what happens if the workflow
contains multiple instances of the same job. To learn how to deal with this
situation, check out the section on
[using multiple instances of the same job](/usage/duplicate-jobs). :::

## Naming jobs

If you want, you can provide an optional name for a job that will be saved in
the database.

```php
$this->define('Publish new podcast')
    ->addJob(new ProcessPodcast($this->podcast), [], 'Process podcast');
```

If no explicit name is provided, the fully qualified class name (**FQCN**) of
the job will be used instead.

You may access a step's name via its `$name` property.

```php
$workflow->jobs[0]->name;
// "Process podcast"
```

::: tip Tip If you plan on displaying the workflow jobs to your users, you could
pass in a translation string as the job name. This way, you would be able to
display the localized name of the job in the UI by using Laravel's built-in
[localization features](https://laravel.com/docs/8.x/localization). :::

## Adding closures as jobs

Venture also allows you to add closures to a workflow.

```php
$this->define('My Workflow')
    ->addJob(function () {
      	Log::info('Star Wars is fantasy, change my mind');
    }, id: 'log-truth');
```

When adding a Closure to a workflow, you **must** specify an explicit ID for the
job, since there is no class name to fall back on. You can specify the ID of a
job by providing the `id` parameter of the `addJob` method.

You may typehint any dependencies that the Closure needs and they will be
resolved out of Laravel’s container when the job gets executed.

```php
$this->define('My Workflow')
    ->addJob(function (TruthGenerator $truths) {
      	Log::info($truths->getHotTake());
    }, id: 'log-truth');
```

## Gated jobs

By default, a job will get dispatched automatically as soon as all of its
dependencies have successfully run. Sometimes, it might be useful to require
that certain jobs need to be started manually, even if their dependencies have
finished. Venture supports this by allowing you to add **gated jobs** to a
workflow.

To add a gated job, you may use the `addGatedJob` method when defining your
workflow.

```php{8-10}
$this->define('Publish Podcast')
    ->addJob(new ProcessPodcast($this->podcast))
    ->addJob(new OptimizePodcast($this->podcast))
    ->addJob(new PublishOnTransistorFM($this->podcast), [
        ProcessPodcast::class,
        OptimizePodcast::class,
    ])
    ->addGatedJob(new NotifySubscribers($this->podcast), [
        PublishOnTransistorFM::class,
    ]);
```

In this example, `NotifySubscribers` depends on `PublishOnTransistorFM`.
However, it won't get started automatically after `PublishOnTransistorFM`
finished. Instead, it will be marked as **gated**.

You can check if a job is gated by calling the `isGated` method on the
`WorkflowJob` instance.

```php
// Fetch the job by querying the `jobs` relation on the `Workflow` model.
$job = $workflow
  ->jobs()
  ->where('name', NotifySubscribers::class)
  ->first();

$job->isGated();
// => true
```

Note that `isGated` will return `false` if the job’s dependencies have not been
finished yet. In other words, if `isGated` returns `true`, it means that the job
is ready to run but needs to be started manually.

To start a gated job, you may call the `start` method on the job.

```php
// $job is the same `WorkflowJob` instance from above
$job->start();
```

After a gated job was started, that branch of the workflow will continue
evaluating as normal.

## Delaying a job

If you don't want to immediately execute a job as soon as it can be run, you can
define a delay for it. To do so, you may call the `withDelay` method on the job.

```php
$this->define('Publish new podcast')
    ->addJob(
    	(new ProcessPodcast($this->podcast))->delay(now()->addDay())
	);
```

This Laravel’s built-in delayed dispatching feature. For more information check
Laravel's
[documentation](https://laravel.com/docs/9.x/queues#delayed-dispatching) on the
topic.

You can also pass the delay as the fourth parameter to the `addJob` method. In
this case, it may be helpful to use named parameters to avoid having to pass the
intermediate arguments.

```php
$this->define('Publish new podcast')
    ->addJob(
    	new ProcessPodcast($this->podcast),
    	[],
    	null,
    	now()->addDay(),
	);

// Or, using named parameters
$this->define('Publish new podcast')
    ->addJob(
    	new ProcessPodcast($this->podcast),
    	delay: now()->addDay(),
	);
```

## Conditional Jobs

Sometimes, it might be useful to only add a job or nested workflow to a workflow
if a certain condition is true. To do so, you may use the `when` method when
defining your workflow.

```php{13-18}
class PublishPodcastWorkflow extends AbstractWorkflow
{
  public function __construct(
    private User $user,
    private Podcast $podcast,
  ) {
  }

  public function definition(): WorkflowDefinition
  {
    return $this->define('Publish Podcast')
      ->addJob(new ProcessPodcast($this->podcast))
      ->when($this->user->is_pro, function (WorkflowDefinition $definition) {
          $definition->addJob(
              new OptimizePodcast($this->podcast),
              [ProcessPodcast::class],
          );
      });
  }
}
```

If the first parameter passed to the `when` method is truthy, the provided
callback gets called with the current `WorkflowDefinition`. You can then add
jobs or workflows as normal.

The `when` method also takes an optional, third parameter which gets called with
the current `WorkflowDefinition` if the value is falsy.

```php{8-15}
return $this->define('Publish Podcast')
    ->addJob(new ProcessPodcast($this->podcast))
    ->when($this->user->is_pro, function (WorkflowDefinition $definition) {
        $definition->addJob(
            new OptimizePodcast($this->podcast),
            [ProcessPodcast::class],
        );
      }, function (WorkflowDefinition $definition) {
        $definition
            ->addJob(
                new DowngradePodcastQuality($this->podcast),
                [ProcessPodcast::class],
	          )
            ->addJob(new SendUpsellingEmail($this->user));
      });
```

The example above produces two possible workflows. One if the user is a pro user
and if the user isn’t a pro user.

![](/workflow-conditional-jobs.svg)

### Depending on conditional jobs

Conditional jobs can change the structure of a workflow. You might be wondering
how to deal with a situation where a job should depend on different jobs,
depending on whether a certain job was added to the workflow or not.

Let’s look at the example from above. Say we want to add a job called
`PublishOnTransistorFM`. If the user is a pro user, this job should run after
`OptimizePodcast` has finshed. If the user isn’t a pro user, it should run after
`DowngradePodcastQuality` has finished.

To deal with this, you may use the `ConditionalDependency` class that comes with
Venture.

```php{1,21-24,30-33}
use Sassnowski\Venture\Graph\ConditionalDependency;

return $this->define('Publish Podcast')
    ->addJob(new ProcessPodcast($this->podcast))
    ->when($this->user->is_pro, function (WorkflowDefinition $definition) {
        $definition->addJob(
            new OptimizePodcast($this->podcast),
            [ProcessPodcast::class],
        );
      }, function (WorkflowDefinition $definition) {
        $definition
            ->addJob(
                new DowngradePodcastQuality($this->podcast),
                [ProcessPodcast::class],
	          )
            ->addJob(new SendUpsellingEmail($this->user));
      })
      ->addJob(
          new PublishOnTransistorFM($this->podcast),
          [
              ConditionalDependency::whenDefined(
                  OptimizePodcast::class,
                  DowngradePodcastQuality::class
              ),
          ],
      )
       ->addJob(
          new PublishOnApplePodcasts($this->podcast),
          [
              ConditionalDependency::whenDefined(
                  OptimizePodcast::class,
                  DowngradePodcastQuality::class
              ),
          ],
      );
```

If the `OptimizePodcast` job exists in the workflow, it would get added as a
dependency for the `PublishOnTransistorFM` and `PublishOnApplePodcasts` jobs. If
not, both jobs would depend on `DowngradePodcastQuality` instead.

![](/workflow-conditional-dependency.svg)

:::tip Testing workflow definitions Things are starting to get complicated now!
You might also want to check out the section on how to go about
[testing your workflow definitions](/testing/testing-workflow-definitions). :::

Conditional dependencies can be combined with regular dependencies, too.

```php
$this->define('Publish Podcast')
	// ...
    ->addJob(
        new PublishOnTransistorFM($this->podcast),
            [
                SomeOtherJob::class,
                ConditionalDependency::whenDefined(
                    OptimizePodcast::class,
                    DowngradePodcastQuality::class,
                ),
          ],
      );
```

You can also leave out the second parameter to the `whenDefined` method. In this
case, the dependency will be completely removed from the job if no corresponding
job exists in the workflow. If that leaves a job without any dependencies, it
will be dispatched immediately after the workflow starts.

## Configuring job queues

You have multiple options to configure which queue or queue connection each job
in a workflow should get dispatched on. Since workflow jobs are just regular
Laravel jobs, everything from
[Laravel’s queue documentation](https://laravel.com/docs/9.x/queues) still
applies to them.

### Configuring individual jobs

To configure the queue or queue connection of an individual job inside a
workflow, you may call the `onQueue` and `onConnection` methods on a job
instance, respectively.

```php
$this->define('Publish Podcast')
    ->addJob(
    	(new ProcessPodcast())->onConnection('sqs'),
    )
    ->addJob(
    	(new OptimizePodcast($this->podcast))->onQueue('high-priority'),
    	[ProcessPodcast::class],
	);
```

This will override any defaults that might have been set inside the job class
itself.

### Configuring all jobs of a workflow at once

If you want to change the queue or queue connections for all jobs in a workflow,
you may call the `allOnQueue` and `allOnConnection` methods on the workflow
definition, respectively.

```php
$this->define('Publish Podcast')
    ->allOnConnection('sqs')
    ->allOnQueue('high-priority')
    ->addJob(new ProcessPodcast())
    ->addJob(
    	new OptimizePodcast($this->podcast),
    	[ProcessPodcast::class],
	);
```

::: warning Configuration precedence Note that calling `allOnQueue` or
`allOnConnection` will always take precedence over a job’s individual
configuration.

```php
$this->define('Publish Podcast')
    ->allOnQueue('high-priority')
    ->addJob(
    	(new ProcessPodcast())->onQueue('medium-priority'),
    )
    ->addJob(
    	new OptimizePodcast($this->podcast),
    	[ProcessPodcast::class],
	);
```

In this example, the `ProcessPodcast` job will still get dispatched on the
`high-priority` queue since `allOnQueue` takes precedence.

:::

## Starting a workflow

Now that you have defined you workflow, you may start it from anywhere within
you application by calling its static `start` method.

```php
$workflow = PublishPodcastWorkflow::start($podcast);
```

Any parameter you pass to the `start` method will be passed to the workflow's
constructor.

The `start` method returns the `Workflow` Eloquent model for the workflow that
you just started. Check out the section on
[how to keep track of workflows](/usage/keeping-track-of-workflows) to learn
about what you can do with this model.

Venture will now figure out which jobs can be immediately dispatched and process
them in parallel. Every time a job finishes, it will check if any of the job's
_dependent_ jobs are now ready to be run. If so, it will dispatch them.

### Starting workflows synchronously

Venture also provides a way to start a workflow synchronously. To do so, you may
call the `startSync` method when starting your workflow.

```php
PublishPodcastWorkflow::startSync($podcast);
```

What this will do is set the queue connection for all jobs of the workflow to
use Laravel’s `sync` driver. This can be useful when developing locally or when
debugging a workflow.

::: details Synchronous evaluation of workflows By definition, Venture cannot
process multiple jobs in parallel when running a workflow synchronously. Instead
Venture will perform a **depth-first** evaluation of the workflow’s dependency
graph.

In a depth-first evaluation, Venture will start by running the first job of the
workflow. After that job has finished, Venture will then try to recursively
evaluate that job’s dependent jobs before moving on to the next job. In other
words, Venture will try and process each branch of the workflow as deeply as it
can until it hits a job that is still waiting on another dependency to be
resolved.

This won’t change the actual behavior of your workflow. I just thought it was
neat. :::

### Starting workflows on different queue connections

It’s also possible to explicitly override the queue connection of all jobs when
starting a workflow. To do so, you may call the `startOnConnection` method to
start your workflow.

```php
ProcessPodcastWorkflow::startOnConnection('sqs', $podcast);
```

This method takes the queue connection as its first parameter. Any other
parameters will be passed to the workflow’s constructor.

```php
SendAnnoyingNewsletterWorkflow::startOnConnection(
    'sqs',
    $user,
    $newsletter,
);
```

The provided connection has to correspond to one of the connections defined in
your application’s queue config.

## Defining a completion callback {#workflow-completion-callback}

You might want to perform an action after a workflow has finished successfully.
To do so, you may call the `then` method on the `WorkflowDefinition` and pass in
a closure.

```php
<?php

use App\Notifications\PodcastPublished;
use App\Models\Podcast;
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
            // ...
            ->then(function (Workflow $workflow) {
                $this->podcast->user->notify(
                    new PodcastPublished($this->podcast)
                );
            });
    }
}
```

Alternatively, you may pass an invokable class to the `then` callback.

```php
$this->define('Publish Podcast')
    // ...
    ->then(new SendNotification());
```

:::tip Global event listeners If you want to perform some action after _any_
workflow has finished, check out the section on
[writing plugins](/plugins/writing-plugins). :::

## Defining an error callback {#workflow-error-callback}

You may want to perform some action whenever a job in your workflow fails. To do
so, you may use the `catch` method when defining your workflow to register an
error handler.

```php
<?php

use Throwable;
use App\Notifications\PublishingPodcastFailed;
use App\Models\Podcast;
use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\WorkflowDefinition;
use Sassnowski\Venture\WorkflowableJob;

class PublishPodcastWorkflow extends AbstractWorkflow
{
    public function __construct(private Podcast $podcast)
    {
    }

    public function definition(): WorkflowDefinition
    {
        return $this->define('Publish Podcast')
            // ...
            ->catch(function (Workflow $workflow, WorkflowableJob $step, Throwable $exception) {
                $this->podcast->user->notify(
                    new PublishingPodcastFailed(
                        $this->podcast,
                        $step->getName(),
                        $e
                    ),
                );
            });
    }
}
```

This callback will be called any time one of the workflow’s jobs fails. The
catch-callback takes three parameters:

- `$workflow` is the Eloquent model of the current workflow
- `$step` is the job instance of the failed job
- `$exception` is the exception that caused the job to fail

By default, Venture will keep processing other jobs of the workflow that are
unaffected by the failed job. This means that the `catch` callback for a
workflow can get called multiple times if multiple jobs fail.

::: tip Dealing with errors The fact that Venture keeps processing a workflow
even if one of the workflow’s steps has failed is a feature, not a bug. Check
out the section on [dealing with errors](/usage/dealing-with-errors) on why this
is a useful property and also how to change this behavior when necessary. :::

## Adding jobs at runtime

It is also possible to add jobs to an instance of a workflow class. This allows
you to dynamically add jobs to a workflow that aren’t defined inside the
workflows `definition` method.

To do so, you may call the `tapDefinition` method on an instance of a workflow.

```php
$workflow = new ProcessPodcastWorkflow($podcast);

$workflow->tapDefinition(function (WorkflowDefinition $definition) use ($podcast) {
    $definition->addJob(new OptimizePodcast($podcast));
});
```

This method takes a callback which gets passed the `WorkflowDefinition` object
of the workflow instance. You can then add jobs or workflows to that definition
just like you would inside the `definition` method itself.

Note that this only changes the definition for this _instance_ of the workflow.

::: warning With great power comes great responsibility While this feature can
be useful in certain situations to dynamically add jobs to a workflow’s
definition, it is something you should use sparingly. The recommended approach
most of the time is to define all jobs a workflow can have inside the
`definition` method. This way, you can see the entire structure of a workflow by
just looking at this method. :::

To start a workflow instance, you may call the `run` method on it.

```php
$workflow->run();
```

The `run` method takes an optional `$connection` parameter that allows you to
specifiy the queue connection for all jobs of the workflow.

```php
$workflow->run('sync');
```

::: danger You cannot change a started workflow’s definition Note that is a way
of dynamically changing a workflow’s definition _before_ it gets started. This
won’t have an effect for workflows that are already running as their definitions
are immutable. :::

## Lifecycle hooks

Workflows expose several hooks which allow you to perform actions during certain
parts of a workflow’s lifecycle.

### `beforeCreate` {#hook-before-create}

The `beforeCreate` hook gets called before a workflow gets persisted to the
database for the first time. This typically happens after the `start` method was
called on a workflow but before the workflow has actually started.

```php
<?php

use Sassnowski\Venture\Models\Workflow;
use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\WorkflowDefinition;

class PublishPodcastWorkflow extends AbstractWorkflow
{
    public function beforeCreate(Workflow $workflow): void
    {
    }
}
```

The `beforeCreate` hook gets passed the `Workflow` Eloquent model for the
workflow. At this point, the model hasn’t been saved to the database yet, which
means it won’t have an ID yet.

::: tip Performing the same action for all workflows The `beforeCreate` hook on
the workflow allows you define actions that are specific to a workflow. If you
want to perform the same action for _all_ of your workflows, you should
[write a plugin](/plugins/writing-plugins#workflow-creating), instead.

If all you want to do is associate workflows with models, you should check out
the built-in [Entity Aware Workflows plugin](/plugins/entity-aware-workflows).
:::

### `beforeNesting` {#hook-before-nesting}

The `beforeNesting` hook gets called when adding a nested workflow to a
workflow’s definition. This happens when the `addWorkflow` method gets called on
the workflow’s definition.

```php
<?php

use Sassnowski\Venture\Models\Workflow;
use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\WorkflowDefinition;

class PublishPodcastWorkflow extends AbstractWorkflow
{
    /**
     * @param array<string, WorkflowableJob> $jobs
     */
    public function beforeNesting(array $jobs): void
    {
    }
}
```

The `beforeNesting` method gets passed the jobs of the nested workflow. At this
point, you can still change these jobs before they get added to the workflow.
