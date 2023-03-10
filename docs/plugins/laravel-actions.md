# Laravel Actions Plugin

[Laravel Actions](https://laravelactions.com/) is a popular package which allows
users to organize their application logic into "action" classes and then run
that class as anything they want. Out of the box, these actions cannot be used
as workflow jobs as they are not implementing the required methods Venture
expects each workflow job to have.

Luckily, Venture comes with a first-party plugin that adds a compatibility
bridge between the two packages.

## Activating the plugin

To activate the plugin, may call `Venture::registerPlugin` inside your
application's service provider.

```php
<?php

use Illuminate\Support\ServiceProvider;
use Sassnowski\Venture\Venture;
use Sassnowski\Venture\Plugin\LaravelActions\LaravelActions;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        Venture::registerPlugin(
            LaravelActions::class,
        );
    }
}
```

Venture will then register special job decorator classes that Laravel Actions
will use when turning an action into a job via `makeJob`. These decorator
classes are compatible with Venture and should be completely opaque to your
application.

## Usage

To add an action to a workflow, you need to call the action's `makeJob` method
instead of creating a new instance of the action via `new`.

```php
<?php

use App\Actions\OptimizePodcast;
use App\Actions\ProcessPodcast;
use App\Actions\ReleaseOnTransistorFM;
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
            ->addJob(OptimizePodcast::makeJob($this->podcast))
            ->addJob(ProcessPodcast::makeJob($this->podcast))
            ->addJob(
                ReleaseOnTransistorFM::makeJob($this->podcast),
                [OptimizePodcast::class, ProcessPodcast::class],
            );
    }
}
```
