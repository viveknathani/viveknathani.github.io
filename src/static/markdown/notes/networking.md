«««
title: networking
»»»

# networking

### introduction

Internet is a global network of networks. It is the way devices exchange data. The most fundamental unit of data exchange is the packet.

End systems are connected to each other via communication links and packet switches. Communication links are made of different types of media, such as copper wire, fiber optics, and radio waves. Packet switches are devices that forward packets from one communication link to another. Routers and link-layer switches are examples of packet switches.

### delays and loss in packet-switched networks

Most packet switches use store-and-forward transmission. In this method, the switch must receive the entire packet before it can begin to transmit the first bit of the packet onto the outbound link. So, if a communication link has a transmission rate of R bits per second, a packet of L bits takes L/R seconds to transmit from the switch's input to its output. If there is a switch or a router between two end systems, the time taken is 2L/R.

An interesting problem:
Let’s say some packets need to be sent from a given source device to a given destination device. there are N links between these devices. by extension, you can say that there are N - 1 routers between these devices. 

each link has a transmission rate of R bits / second. the size of the packet that you want to send is L bits. 

what would be the total time taken for P packets to go from source to destination?

Answer: (N + (P - 1)) * L / R

This does not account for queuing delays, processing delays, and propagation delays.

queuing delays: the time a packet spends in a router's queue waiting to be transmitted onto the link.

processing delays: the time it takes to examine the packet's header and determine where to direct the packet.

propagation delays: the time it takes for a bit to travel from one router to the next.

nodal delay = processing delay + queuing delay + transmission delay + propagation delay

end-to-end delay for a single packet across N links = N * nodal delay

An interesting thing to understand is why does packet loss occur? Packet loss occurs when a packet arrives at a router and the router's output buffer is full. The router will drop the packet. This is called congestion.

### how traceroute works

[computerphile](https://www.youtube.com/watch?v=75yKT3OuE44&ab_channel=Computerphile)

### protocol layers in the IP stack

application layer: the layer that is closest to the end user. This layer contains the protocols that the end user interacts with. Examples include HTTP, SMTP, and FTP. Each message in this layer is called a message.

transport layer: this layer is responsible for end-to-end communication. It is responsible for breaking the data into packets and reassembling them at the destination. Examples include TCP and UDP. Each message in this layer is called a segment.

network layer: this layer is responsible for routing packets from the source to the destination. It is responsible for addressing and routing. Examples include IP. Each message in this layer is called a datagram.

link layer: this layer is responsible for transferring data between two devices on the same link. It is responsible for error detection and correction. Examples include Ethernet. Each message in this layer is called a frame.

physical layer: this layer is responsible for transmitting bits over a communication link. It is responsible for the physical connection between devices. Examples include copper wire, fiber optics, and radio waves.
