# Should you use this package?

If you are familiar with [job batching](https://laravel.com/docs/8.x/queues#job-batching) in Laravel, you might be wondering if this package isn't doing the same thing. Especially now that it's possible to nest chains inside batches. Compare these two examples, the first one using Laravel's batching feature and the second one using this package.

**Laravel Batches**

```php
Bus::batch([
    new Job1(),
    new Job2(),
    [
        new Job3(),
        new Job4(),
    ]
])->dispatch();
```

**Workflows**

```php
Workflow::new()
    ->addJob(new Job1())
    ->addJob(new Job2())
    ->addJob(new Job3())
    ->addJob(new Job4(), [Job3::class])
    ->start();
```

Both would create a dependency graph that looks like this:

![](/workflow-2.svg)

If this is level of complexity you have to deal with inside your workflows, then you're probably better off using the batching and chaining features Laravel already provides.

## A more complex example

Let's look at the example from the introduction again. This is the dependency graph that we are trying to model.

![](/workflow.svg)

This is where it starts to get interesting. You have a workflow with very complex interdependencies between jobs. Some jobs depend on more than one step to finish, some only one a single job and some don't have any dependencies at all.
