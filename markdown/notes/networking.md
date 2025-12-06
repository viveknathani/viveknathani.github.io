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

### transport layer

two protocols: TCP and UDP

services expected from an ideal transport layer protocol
1. multiplexing and demultiplexing: mapping an incoming/outgoing packet to a process in the host
2. error detection: packets may have corrupted bits, check if this is happening
3. error correction: if packets have corrupted bits, some mechanism for correction is needed
4. ordered delivery: ensure that the packets are delivered in the correct ordered
5. flow control: preventing a fast sender from overwhelming a slow receiver by regulating data transmission rates
6. congestion control: manage network congestion by adjusting the transmission rate to avoid excessive packet loss and delays

UDP just gives you multiplexing and demultiplexing, along with error detection. upon detecting an error, it simply drops that packet.

TCP does 1 and 2 like UDP. but it also does automatic retransmission of lost or corrupted packets using acknowledgments (ACKs) and timeouts thereby solving for error correction. it ensures that packets are delivered in sequence using sequence numbers and buffering out-of-order packets until all preceding packets arrive. it uses a sliding window mechanism to ensure that a sender does not overwhelm a slow receiver by adjusting the amount of data that can be sent at a time. unlike UDP (which is connection-less), TCP is connection-oriented, meaning that it establishes a connection before data transfer (via the three-way handshake). there are two common algorithms for doing error correction + ordered delivery: go-back-n and selective repeat. TCP employs a combination of these two.

A link's throughput can never exceed it's capacity. Delay increases as capacity is approached. Retransmission decreases effective throughput. This is congestion.

Basic approaches to congestion control: end-to-end and (used by TCP), network assisted (routers facilitate this, recent versions of TCP implement this in a hybrid fashion with the basic end-to-end approach)

A great video on TCP congestion control: https://www.youtube.com/watch?v=cIHiSR4j3g4&ab_channel=JimKurose

### network layer

forwarding: move a packet from a router’s input link to it’s output link, often implemented at hardware level

routing: move a packet from source to destination, often implemented at a software level

if you just consider IPv4, that means 2^32 IP addresses. you clearly can’t store all of them in a routing table. hence, routing table entries are often aggregated into ranges. for a given IP, the router tries to do longest prefix matching (use the longest prefix that matches the destination address). routers use TCAM to do this in a single clock cycle.

subnet - represents a network by having an IP prefix (a.b.c.d/24 means first 24 bits are fixed in the network, a.b.c is the constant)

the a.b.c.d/x form of addressing is called as CIDR

before CIDR, network prefixes were considered to be of fixed size 8-bit (class A), 16-bit (class B), 24-bit (class C) - classful addressing

in every subnet, two addresses are reserved for special use. for a subnet range 192.168.1.0/24, the network address is 192.168.1.0. this address identifies the entire subnet. and the broadcast address is 192.168.1.255 and is like a loudspeaker that broadcasts messages to everyone in the neighborhood.

a subnet mask is a 32-bit number created by setting host bits to all 0s and setting network bits to all 1s. performing a logical AND between the subnet mask and IP address gives the network address.

when host gets an IP in a network, it typically gets it dynamically via DHCP.

how does an ISP get block of addresses? ICANN allocates IP addresses to 5 regional registries who may then distribute it forward. IPv4 however has been exhausted. this had led to techniques like NAT and creation of IPv6.

NAT: all devices in a local network share just one IPv4 address as far as the outside world is concerned. private address space is usually one of these: 10/8, 172.16/12, 192.168/16. NAT has led to issues like what if one host wants to connect directly to a host behind a NAT - this is problem is solved by NAT traversal which works but it is sort of a hack. still, NAT has eased the pressure and is widely used. in lower level terms: it is a method of mapping an IP address space into another by modifying network address information in the IP header of packets while they are in transit across a traffic routing device.

everybody should ideally move to IPv6 but until that happens, a neat layer of interoperatability is needed. IP tunelling solves for this. IPv6 datagram is carried inside IPv4 datagram when travelling through IPv4 routers. 

IPv6 adoption: https://www.google.com/intl/en/ipv6/statistics.html

generalized forwarding is a flexible approach to packet forwarding in networking, where routers and switches process packets based on abstract, programmable rules rather than rigid, protocol-specific logic. unlike traditional forwarding, which relies on fixed fields (e.g., IP addresses, MAC addresses) and specific routing protocols, GF enables forwarding decisions based on arbitrary packet attributes. checkout https://p4.org - a language used to define custom forwarding behavior in switches and routers.

google uses SDN to control its data center network called B4.

routing algorithms can be centralised or decentralised. in the centralised approach, every router has complete information about the whole network. a link state algorithm works like this. a commonly deployed link state algorithm is based on dijkstra’s algorithm. time complexity here is O(n^2) but can be brought down to logarithmic time with the usage of heaps.

in a decentralised approach, each router begins with only the knowledge of the costs of itws own directly attached links. the distance vector routing algorithm, based on the bellman-ford equation, works like this. 

an autonomous system (AS) is a collection of networks that share a single routing policy. within an AS, routers use interior gateway protocols to figure out the best way to move packets around. one of the most common igps is ospf (open shortest path first), which is designed to be fast, scalable, and efficient.

OSPF breaks the network into areas to keep things organized and reduce unnecessary traffic. every router in an area keeps a full map of the network (called a link-state database) and runs dijkstra’s shortest path first (SPF) algorithm to figure out the best routes. instead of just sending updates like other protocols, ospf constantly syncs the full network state, making it super reliable for dynamic networks.

but when traffic needs to move between different autonomous systems, that’s where bgp (border gateway protocol) comes in. bgp is an exterior gateway protocol (EGP) that connects different ases and decides the best paths for internet traffic. unlike ospf, bgp doesn’t rely on shortest paths—it makes routing decisions based on policies, path attributes, and network stability. routers using BGP exchange massive routing tables and constantly update each other to adapt to network changes. this is what keeps the internet running smoothly, making sure data finds the best path across a global network of ASes.

ICMP (internet control message protocol) is basically the internet’s way of sending error messages and network diagnostics. it doesn’t move actual data like tcp or udp but instead helps devices figure out if something’s wrong with a connection.

when you ping a website, that’s icmp in action. your device sends an icmp echo request, and if the target responds with an echo reply, you know it’s reachable. if there’s an issue, like a router being down or a packet being too big, icmp sends back error messages like “destination unreachable” or “packet too big” so the sender can adjust.

but ICMP isn’t just for pings—it’s also used in tools like traceroute, which maps the path packets take across the internet by sending special icmp messages to each router along the way. even though it’s super useful, icmp can be exploited for attacks like icmp floods (aka ping of death), so some networks limit or block it for security reasons.

### other stuff

SDN (software-defined networking) is a modern approach to networking where the control plane (the part that decides where traffic goes) is separated from the data plane (the part that actually moves packets). instead of relying on traditional, hardware-based routing decisions, SDN uses a central controller that programs network behavior dynamically. this makes networks way more flexible, scalable, and easier to manage, especially in large-scale cloud and data center environments.
one of the best examples of sdn in action is google’s B4, a private backbone network that connects google’s data centers worldwide. before b4, google had to rely on expensive, static networking solutions from traditional providers. with sdn, B4 lets google control traffic flow efficiently, dynamically rerouting data to avoid congestion and maximize bandwidth. it treats the entire network like a software system, optimizing paths in real-time based on demand. this is a huge deal because it allows google to push way more data through its network while keeping costs low and performance high.

proxy - forward proxy secures clients, reverse proxy secures servers.

VPNs (virtual private networks) create secure, encrypted connections between devices and networks over the internet. they’re mainly used for privacy, security, and bypassing restrictions by routing traffic through a remote server.
there are two main types of vpns: remote access VPNs (used by individuals to securely connect to a private network, like a company’s internal system) and site-to-site VPNs (used by businesses to connect entire networks across different locations). vpns work by encapsulating data inside encrypted tunnels, preventing snooping from isps, hackers, or even governments.
protocols like openvpn, wireguard, ipsec, and l2tp define how VPNs establish connections and secure data. modern VPNs prioritize speed and encryption strength, with wireguard being a game-changer due to its simplicity and efficiency.
while vpns are great for security, they’re not foolproof—if the VPN provider logs user activity or gets compromised, privacy can still be at risk. plus, vpns don’t protect against all online threats, so pairing them with good security practices is key.

tailscale is a peer-to-peer (p2p) VPN that doesn’t rely on a central remote server to route traffic. instead, it builds direct, encrypted connections between devices using wireguard while relying on a coordination server (control plane) for authentication and device discovery.

802.11 is the IEEE standard for WiFI, defining how wireless networks work. it covers everything from radio frequencies to data transmission and security protocols. different versions of 802.11 bring improvements in speed, range, and efficiency.
