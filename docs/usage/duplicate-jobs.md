# Duplicate Jobs

It can often be useful to have multiple instances of the same job to a workflow.
For example, you might want to encode your podcasts as both mp3 and wav. You
could add an `EncodePodcast` job to your workflow which takes the target output
format as a parameter and have them run in parallel.

<div style="text-align: center;">
    <img src="/multiple-jobs.svg" />
</div>

## Adding multiple instances of the same job

When adding more than one instance of the same job to a workflow, you need to
provide an explicit id for each of these jobs. You can do this by providing the
`id` parameter when adding a job.

```php
$this->define('Publish podcast')
    ->addJob(new ProcessPodcast($this->podcast))
    ->addJob(
        new EncodePodcast('mp3', $this->podcast),
        dependencies: [ProcessPodcast::class],
        id: 'encode-mp3'
    )
    ->addJob(
        new EncodePodcast('wav', $this->podcast),
        dependencies: [ProcessPodcast::class],
        id: 'encode-wav'
    );
```

These ids have to be unique only within the workflow definition. Venture will
throw a `DuplicateJobException` when you try adding a job with an id that
already exists in the workflow.

```php
$this->define('Publish podcast')
    ->addJob(new ProcessPodcast($this->podcast))
    ->addJob(
        new EncodePodcast('mp3', $this->podcast),
        dependencies: [ProcessPodcast::class],
        id: 'encode-podcast'
    )
    // Throws a `DuplicateJobException` because a job with
    // the id `encode-podcast` already exists in this workflow.
    ->addJob(
        new EncodePodcast('wav', $this->podcast),
        dependencies: [ProcessPodcast::class],
        id: 'encode-podcast'
    );
```

You don't have to provide explicit ids for every job in a workflow, only jobs
that are instances of the same class. This is because Venture will use the FQCN
of the job class as the id by default.

## Depending on specific jobs

Things become more interesting when some branch of your workflow depends on only
one of those jobs.

<div style="text-align: center;">
    <img src="/flac-bois.svg" />
</div>

In this case, we want to depend _only_ on the job that encodes our podcast as
flac. Since we have to provide explicit ids for all `EncodePodcast` job anyways,
this becomes a cinch. All we have to do is provide the id of the job as the
dependency.

```php
$this->define('Publish podcast')
    ->addJob(new ProcessPodcast($this->podcast))
    ->addJob(
        new EncodePodcast('mp3', $this->podcast),
        dependencies: [ProcessPodcast::class],
        id: 'encode-mp3'
    )
    ->addJob(
        new EncodePodcast('wav', $this->podcast),
        dependencies: [ProcessPodcast::class],
        id: 'encode-wav'
    )
    ->addJob(
        new EncodePodcast('flac', $this->podcast),
        dependencies: [ProcessPodcast::class],
        id: 'encode-flac'
    )
    ->addJob(
        new NotifyAudiophileMailingList($this->podcast),
        dependencies: ['encode-flac'] // Use the id as the dependency
    )
```

::: tip Note

Venture always depends on the id of a job internally, even if you don't
explicitly provide one. In these cases, the fully qualified name (or **FQCN**
for short) of the class will be used as the id. This means that this really
isn't any different than depending on regular, non-duplicate job.

:::

## Duplicate jobs in nested workflows

Venture provides an option to add [nested workflows](/usage/nesting-workflows)
to a workflow. This is useful if you have a collection of jobs that you want to
reuse across multiple workflows or want to treat them as their own logical unit.

Venture is smart enough to automatically prefix the ids of all jobs in a nested
workflow, so you don't have to worry about accidentally introducing a conflict.
You could, for example, extract all jobs related to the `flac` version of your
podcast into a separate workflow.

```php
class FlacPodcastWorkflow extends AbstractWorkflow
{
    public function __construct(private Podcast) {}

    public function definition(): WorkflowDefinition
    {
        return $this->define('Flac Workflow')
            ->addJob(new EncodePodcast('flac', $this->podcast))
            ->addJob(
                new NotifyAudiophileMailingList($this->podcast),
                dependencies: [EncodePodcast::class],
            );
    }
}
```

Note how we didn't need to provide an explicit id for the `EncodePodcast` job
because it's the only one of its kind in this workflow. We can still embed this
workflow inside another workflow that also contains `EncodePodcast` jobs.

```php
$this->define('Publish podcast')
    ->addJob(new ProcessPodcast($this->podcast))
    ->addJob(
        new EncodePodcast('mp3', $this->podcast),
        dependencies: [ProcessPodcast::class],
        id: 'encode-mp3'
    )
    ->addJob(
        new EncodePodcast('wav', $this->podcast),
        dependencies: [ProcessPodcast::class],
        id: 'encode-wav'
    )
    ->addWorkflow(
        new FlacPodcastWorkflow($this->podcast),
        dependencies: [ProcessPodcast::class],
    );
```

This will not introduce a conflict because the id of the `EncodePodcast` job
inside the `FlacPodcastWorkflow` will get namespaced to the inner workflow.

The above example would produce a workflow like this.

<div style="text-align: center;">
    <img src="/flac-bois-workflow.svg" />
</div>

:::danger Note

While it is technically possible to directly depend on a job from a nested
workflow, you should always depend on the **workflow** instead. Depending on a
job inside a nested workflow not only breaks encapsulation, it could potentially
change the structure of the workflow.

If you find yourself continuously needing to depend on a nested job, it might be
a sign that you should extract this dependency into its own workflow.

:::
