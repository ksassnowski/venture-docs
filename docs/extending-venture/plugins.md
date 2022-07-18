# Plugins

The main way to extend Venture is by writing plugins. Venture fires events during various parts of the lifecycle of a workflow. Plugins provide you with a convenient way to hook into these events.

## Creating a plugin

A plugin is a class that implements the `Plugin` interface that comes with Venture. This interface defines a single method `install` that Venture calls when your application boots.

```php
<?php
  
use Sassnowski\Venture\Plugin\Plugin;
use Sassnowski\Venture\Plugin\PluginContext;
  
class MyFirstPlugin implements PluginInterface
{
    public function install(PluginContext $context): void
    {
        // ...
    }
}
```

The `install` method accepts a `PluginContext` as its only argument. The `PluginContext` is the main API provided to plugins that allows them to hook into Venture’s various events. 

To register an event listener, call the method on the `PluginContext` that corresponds to the event and pass in a handler.

```php
public function install(PluginContext $context): void
{
    $context->onWorkflowCreating(function (WorkflowCreating $event) {
       // work, work, work... 
    });
}
```

::: tip Available events
See the [section below](#available-events) for a complete list of all methods the `PluginContext` exposes as well as their corresponding events.
:::

You aren’t limited to a single event handler per event. You can call the same method of the `PluginContext` multiple times to register multiple handlers.

```php
public function install(PluginContext $context): void
{
    $context->onWorkflowCreating(function (WorkflowCreating $event) {
       // work, work, work... 
    });
    
    $context->onWorkflowCreating(function (WorkflowCreating $event) {
       // different work, work, work...
    });
}
```

While the examples above uses a closure as an event handler, you can pass any parameter that Laravel’s event dispatcher understands.

```php
$context->onWorkflowCreating(MyEventListener::class);
$context->onWorkflowCreating([MyEventListener::class, 'execute']);
$context->onWorkflowCreating('App\Listeners\MyEventListener@execute');
```

When registering a handler using a class string, the handler will be resolved out of Laravel’s container. This means you can typehint any dependency your event listener might need in its constructor.

### Plugin dependencies

Plugins themselves also get resolved out of Laravel’s container. This means you can typehint any dependency the plugin needs in its constructor.

```php
<?php
    
use App\SomeService;
use Sassnowski\Venture\Plugin\Plugin;
use Sassnowski\Venture\Plugin\PluginContext;

class MyPlugin implements Plugin
{
    public function __construct(private SomeService $service)
    {
    }
    
    public function install(PluginContext $context): void
    {
        // ...
    }
}
```

### Other setup inside a plugin

A plugin’s `install` method isn’t limited to registering event listeners. For example, if your plugin also needs to [change the default models](/configuration/customizing-models) Venture uses, you can also add this to your plugin’s `install` method.

```php
<?php

use App\Models\MyWorkflowModel;
use App\Models\MyWorkflowJobModel;
use Sassnowski\Venture\Plugin\Plugin;
use Sassnowski\Venture\Plugin\PluginContext;

class MyPlugin implements Plugin
{
    public function install(PluginContext $context): void
    {
        Venture::useWorkflowModel(MyWorkflowModel::class);
        Venture::useWorkflowJobModel(MyWorkflowJobModel::class);

        // Other plugin setup...
    }
}
```



::: danger Plugins get registered during `boot`
Be aware that plugins get installed when the `boot` method of Venture’s service provider gets called. This means that any setup that needs to happen during the `register` phase of the application startup–such as registering container bindings–should not be performed inside a plugin.
:::

## Registering Plugins

Plugins are registered by calling `Venture::registerPlugin` and passing it the fully qualified name of your plugin class. This should be done inside the `register` method of your `AppServiceProvider`.

```php
<?php
    
use App\Plugins\MyPlugin;
use Illuminate\Support\ServiceProvider;
use Sassnowski\Venture;
    
class AppServiceProvider extends ServiceProvider
{
    public function register()
    {
        Venture::registerPlugin(MyPlugin::class);
    }
}
```

You also pass multiple plugins to the `registerPlugin` call at once.

```php
Venture::registerPlugin(
    MyFirstPlugin::class,
    MySecondPlugin::class,
);
```

## Available Events

Below is a list of all events Venture fires during its life cycle. You can click on each event to jump to the section explaining when this event gets fired, how to register a handler for it, and what the event payload is.

- [`JobAdding`](#jobadding)
- [`JobAdded`](#jobadded)
- [`JobCreating`](#jobcreating)
- [`JobCreated`](#jobcreated)
- [`JobFailed`](#jobfailed)
- [`JobFinished`](#jobfinished)
- [`JobProcessing`](#jobprocessing)
- [`WorkflowAdding`](#workflowadding)
- [`WorkflowAdded`](#workflowadded)
- [`WorkflowCreating`](#workflowcreating)
- [`WorkflowCreated`](#workflowcreated)
- [`WorkflowFinished`](#workflowfinished)
- [`WorkflowStarted`](#workflowstarted)

### `JobAdding`

### `JobAdded`

### `JobCreating`

### `JobCreated`

### `JobFailed`

### `JobFinished`

### `JobProcessing`

### `WorkflowAdding`

### `WorkflowAdded`

### `WorkflowCreating`

### `WorkflowCreated`

### `WorkflowFinished`

### `WorkflowStarted`
