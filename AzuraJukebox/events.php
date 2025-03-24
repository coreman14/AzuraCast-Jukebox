<?php

declare(strict_types=1);

use App\CallableEventDispatcherInterface;
use App\Event;

return static function (CallableEventDispatcherInterface $dispatcher) {
    // Tell the view handler to look for templates in this directory too
    $dispatcher->addListener(Event\BuildView::class, function(Event\BuildView $event) {
        $event->getView()->addFolder('AzuraJukebox', __DIR__.'/templates');
    });

    $dispatcher->addListener(Event\BuildRoutes::class, function(Event\BuildRoutes $event) {
        $app = $event->getApp();

        $app->get('/example', \Plugin\AzuraJukebox\Controller\HelloWorld::class)
            ->setName('AzuraJukebox:index:index')
            ->add(\App\Middleware\EnableView::class);
    });
};
