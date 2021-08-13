---
title: Share folders and bind ports between a docker container and windows 7
date: 2016-12-01
description: This post describes what you have to do in order to share folders and bind ports between a docker container and windows 7.
type: post
---

In one of the projects I work on I need an apache http server installed locally on my windows development system. The installation and additional configuration are documented in our confluence but I still need to do them manually. One way to automatically install and configure apache to do that job is to use [docker][docker]. I still use windows 7 on my laptop so the only way for me to have docker was to install [docker toolbox][docker-toolbox]. In this case [docker engine][docker-engine] is installed in a [boot2docker][boot2docker] vm that runs in [virtualbox][virtualbox]. Docker documentation describes [docker volumes][docker-volumes] and [port binding][port-binding], but on windows it is very easy to forget that the host is not the windows system but the [boot2docker][boot2docker] vm. In the next lines I'll describe what you have to do to share folders and bind ports between a docker container and windows 7.

## Configure shared folders between [boot2docker][boot2docker] vm and windows

Open [virtualbox][virtualbox], find [boot2docker][boot2docker] vm and click on settings.

[![virtualbox-default-image][virtualbox-default-image]][virtualbox-default-image]

Click on **Shared Folders** and add a new one. **Folder Name** will be used to mount the folder in [boot2docker][boot2docker] vm.

[![virtualbox-default-settings-sharedfolders-image][virtualbox-default-settings-sharedfolders-image]][virtualbox-default-settings-sharedfolders-image]

[![virtualbox-default-settings-sharedfolders-add-image][virtualbox-default-settings-sharedfolders-add-image]][virtualbox-default-settings-sharedfolders-add-image]

I checked **Make Permanent** option to have the shared folder available after [boot2docker][boot2docker] vm reboot and I checked **Auto-mount** to have it automatically mounted. Unfortunately **Auto-mount** does not work for [boot2docker][boot2docker] vm and I have to mount it after each reboot.

Open **Docker Quickstart Terminal** and run the following commands:

```
docker-machine ssh default "sudo mkdir -p /media/HostVM-Work"
docker-machine ssh default "sudo mount -t vboxsf -o uid=1000,gid=50 Work /media/HostVM-Work"
```

Shared folder **Work** is mounted now in **/media/HostVM-Work** folder in [boot2docker][boot2docker] vm.

Create a file in **Work** folder in windows. I created a text file named **windows.txt**.

Do a ssh in [boot2docker][boot2docker] vm and check the content of the shared folder.

```
docker-machine ssh default
ll /media/HostVM-Work
```

You should see the **windows.txt** file created previously. Create a file in [boot2docker][boot2docker] vm and check the folder again.

```
echo "HostVM" > /media/HostVM-Work/hostvm.txt
ll /media/HostVM-Work
```

You should see both files now.

[![docker-machine-ssh-shared-folder-image][docker-machine-ssh-shared-folder-image]][docker-machine-ssh-shared-folder-image]

## Configure port binding between [boot2docker][boot2docker] vm and windows

Open [virtualbox][virtualbox], find [boot2docker][boot2docker] vm and click on settings.

[![virtualbox-default-image][virtualbox-default-image]][virtualbox-default-image]

Click on **Network**, expand **Advanced** and click on **Port Forwarding**. I bound [boot2docker][boot2docker] vm ports 80 and 443 (Guest port) to windows ports 80 and 443 (Host port).

[![virtualbox-default-settings-network-image][virtualbox-default-settings-network-image]][virtualbox-default-settings-network-image]

[![virtualbox-default-settings-network-portforwardingrules-image][virtualbox-default-settings-network-portforwardingrules-image]][virtualbox-default-settings-network-portforwardingrules-image]

## Share folders and bind ports between a docker container and [boot2docker][boot2docker] vm

This can be done with command line arguments when running the container.

```
docker run -it -p 80:80 -v /media/HostVM-Work:/media/Container-Work ubuntu:16.10 /bin/bash
```

This command starts a container with **ubuntu:16.10** image, binds [boot2docker][boot2docker] vm port 80 to port 80 of the container and mounts **/media/HostVM-Work** [boot2docker][boot2docker] vm's folder to **/media/Container-Work** container's folder. You can verify the folder with the following commands.

```
ll /media/Container-Work
```

You should see **windows.txt** and **hostvm.txt** files created previously. Create another file in **/media/Container-Work** folder and check it again.

```
echo "Container" > /media/Container-Work/container.txt
ll /media/Container-Work
```

You should see all three files now.

[![container-shared-folder-image][container-shared-folder-image]][container-shared-folder-image]

In order to verify port binding you need to install a server that listens on port 80.

```
apt-get update
apt-get install apache2
/etc/init.d/apache2 start
```

Open a browser in windows and type **localhost**. You should see the default web page displayed by apache.

[![container-forward-port-80-windows-image][container-forward-port-80-windows-image]][container-forward-port-80-windows-image]

These are steps needed to share folders and bind ports between a docker container and windows 7, please let me know if you encounter any issues following them.

[docker]: https://www.docker.com/
[docker-toolbox]: https://www.docker.com/products/docker-toolbox
[docker-engine]: https://www.docker.com/products/docker-engine
[boot2docker]: http://boot2docker.io/
[virtualbox]: https://www.virtualbox.org/
[docker-volumes]: https://docs.docker.com/engine/tutorials/dockervolumes/
[port-binding]: https://docs.docker.com/engine/userguide/networking/default_network/binding/
[virtualbox-default-image]: /images/posts/share-folders-bind-ports-docker-windows-7/virtualbox-default.png
[virtualbox-default-settings-sharedfolders-image]: /images/posts/share-folders-bind-ports-docker-windows-7/virtualbox-default-settings-sharedfolders.png
[virtualbox-default-settings-sharedfolders-add-image]: /images/posts/share-folders-bind-ports-docker-windows-7/virtualbox-default-settings-sharedfolders-add.png
[docker-machine-ssh-shared-folder-image]: /images/posts/share-folders-bind-ports-docker-windows-7/docker-machine-ssh-shared-folder.png
[virtualbox-default-settings-network-image]: /images/posts/share-folders-bind-ports-docker-windows-7/virtualbox-default-settings-network.png
[virtualbox-default-settings-network-portforwardingrules-image]: /images/posts/share-folders-bind-ports-docker-windows-7/virtualbox-default-settings-network-portforwardingrules.png
[container-shared-folder-image]: /images/posts/share-folders-bind-ports-docker-windows-7/container-shared-folder.png
[container-forward-port-80-windows-image]: /images/posts/share-folders-bind-ports-docker-windows-7/container-forward-port-80-windows.png