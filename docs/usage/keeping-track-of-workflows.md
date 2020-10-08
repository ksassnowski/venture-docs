# Keeping track of workflows

All workflows and their individual steps get stored inside the database. When you start a workflow, an instance of the workflow will be returned.

```php
$workflow = Workflow::new('Publish Podcast')
    ->addJob(new ProcessPodcast($podcast))
    // ...
    ->start();
```

::: tip Note
A workflow is just a regular Eloquent model, so you can do all the things with it that you're used to from Eloquent.
:::

## Performing an action after the workflow has finished

Similar (read: exactly the same) to how [batches work in Laravel](https://laravel.com/docs/8.x/queues#dispatching-batches), you can register a callback to execute after the workflow has finished. To do so, chain a `then` call before you start your workflow and pass in a closure.

```php
Workflow::new('Example Workflow')
    ->addJob(new ExampleJob())
    ->then(function (Workflow $workflow) {
        // This will get called once every job in the workflow has finished.
        // It gets passed the workflow instance.
    })
    ->start();
```

Alternatively, you can pass an invokable class to the `then` callback.

```php
class SendNotification
{
    public function __invokable(Workflow $workflow)
    {
        // Do something with the workflow...
    }
}

Workflow::new('Example Workflow')
    ->addJob(new ExampleJob())
    ->then(new SendNotification())
    ->start();

```
