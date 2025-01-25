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

### http

http is an application layer protocol that pretty much runs the web.

an important thing to understand is the difference between a persistent and a non persistent connection. a non persistent connection is where you need to open a separate tcp connection for each request/response pair. in a persistent connection, the same tcp connection can be reutilised. this is a significant performance gain.

http/1.0 employees non persistent tcp connections by default. http/1.1 employees persistent connections by default. 

http/1.1 suffers from a head of line blocking problem. if the first request in a shared tcp connection take a lot of time (like the first payload being too big let’s say), this causes an issue for subsequent requests as they never get the chance to reach the server. browsers employ parallel tcp connections to circumvent this.

http/2 solves the head of line blocking problem by the idea of framing. it breaks a request into a unit called as a frame. and it sends frames from all possible requests in a rotational/interleaved manner. this gives every request a fairer chance to reach the server. the larger request will still take a considerable amount of time to finish but the perceived latency will still be low because the smaller requests will resolve quickly and user will be able to see atleast something on the webpage.

http/2 also allows a push behaviour. servers can push data to their clients which is faster and desirable in some situations. from wikipedia: In practice, Server Push frequently results in wasted bandwidth because the server rarely knows which resources are already loaded by the client and transmits the same resource multiple times, resulting in slowdowns if the resources being pushed compete for bandwidth with resources that were requested. http/2 also increases bandwidth efficiency by using a binary compressed format for headers.

still, http/2 does not have wide adoption. and the world is slowly moving towards http/3 - based on QUIC. a lot of big tech seems to run on http/3. cloudflare, akamai, and fastly are early adopters of HTTP/3, offering it to customers as part of their CDN services.
