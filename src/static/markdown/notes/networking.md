«««
title: networking
»»»

# networking

1. packets consist of two types of data: control information and user data. control information is stuff like source and destination addresses, error detection codes, some sequencing information, etc.
2. with packets, the bandwidth of the transmission medium can be better shared among users than if the network were circuit switched. when one user is not sending packets, the link can be filled with packets from other users, and so the cost can be shared, with relatively little interference, provided the link is not overused. often the route a packet needs to take through a network is not immediately available. In that case, the packet is queued and waits until a link is free. 
3. physical link technologies of packet networks typically limit the size of packets to a certain maximum transmission unit (MTU).
4. physical or geographic locations of network nodes and links generally have relatively little effect on a network, but the topology of interconnections of a network can significantly affect its throughput and reliability.
5. OSI model
    1. physical
    2. data link
    3. network
    4. transport
    5. session
    6. presentation
    7. application
6. a network interface controller (NIC), also known as a network adapter or network card, is a hardware component that enables a device to connect to a network. It can be integrated into the motherboard of a computer or installed as a separate expansion card. the NIC facilitates communication between the device and the network by converting data from the computer into a format suitable for transmission over the network and vice versa. it typically has a unique identifier called a MAC address, which helps in identifying the device on the network. NICs can support various types of network connections, such as Ethernet, Wi-Fi, or Bluetooth, depending on the requirements of the device and the network infrastructure.
7. network protocols maybe connection-less or connection-oriented
8. HTTP
    1. v1 was a simple text based protocol
    2. v1.1 introduced persistent connections, host header, OPTIONS method, the 100 continue status code
    3. v2 introduced multiplexing of requests over a single TCP connection, header compression, binary data instead of text, server push
    4. v3 runs on QUIC instead of TCP. QUIC is designed for mobile-heavy Internet usage in which people carry smartphones that constantly switch from one network to another as they move about their day. QUIC relies on UDP under the hood.
9. HTTPS 
    1. goal is to make the communication encrypted
    2. do it by using TLS under the hood
    3. uses port 443 instead of port 80
    4. prevents MITM and eavesdropping attacks
    5. it encrypts all message contents, including the HTTP headers and the request/response data.
10. TLS
    1. client sends a request for setting up a secure connection
    2. client presents a list of supported ciphers and hash function
    3. from this list, the server picks a cipher and hash function that it also supports and notifies the client of the decision
    4. server then provides a digital certificate that it has. a digital certificate has the website name, CA name, some validity, and the server’s public encryption key
    5. client confirms the validity of the certificate before proceeding
    6. session key is generated on both client and server side that is used for encryption later.
    7. TLS 1.3 is faster and more secure than TLS 1.2.
11. SSH
    1. has TCP under the hood
    2. used for connecting to remote machines
    3. public key cryptography is used
    4. in HTTPS, only client validates the identity of the server whereas here, client’s identity is verified too
12. TCP and UDP - google if needed
13. IP
    1. connection-less and best effort based
    2.  IP addresses uniquely identify devices on a network. IPv4 addresses are 32 bits long and are typically represented in dotted-decimal notation (e.g., 192.168.1.1). IPv6, the newer version, uses 128-bit addresses to accommodate the growing number of devices on the Internet.
    3. IP routers use routing tables to determine the best path for forwarding packets towards their destination based on the destination IP address. this allows packets to traverse multiple networks to reach their final destination.
    4. IP supports packet fragmentation, allowing large packets to be broken down into smaller fragments for transmission across networks with different maximum transmission unit (MTU) sizes. at the destination, these fragments are reassembled into the original packet.
    5. IPv4 is the most widely used version of IP but is limited by its address space. IPv6 was developed to address this limitation and provide a much larger address space, as well as improvements in security and network configuration.
14. ICMP
    1. it is used for diagnostic and control purposes in IP networks.
    2. ICMP is primarily used to send error messages and diagnostic information between network devices.
    3. one of the most common uses of ICMP is the Echo Request and Echo Reply messages, often referred to as "ping."
    4. ICMP Time Exceeded messages are generated by routers when they discard a packet due to its Time to Live (TTL) field reaching zero.
15. ARP - IP to MAC address - IPv6 uses NDP instead
16. DHCP
    1. assign IP to devices in a network
    2. steps involved - discover, offer, request, acknowledge
17. FTP
    1. uses two connections - one for control (port 21) and one for data (port 20).
    2. FTP supports two modes of operation for transferring data: ASCII mode and binary mode.
18. NAT - is a method of mapping an IP address space into another by modifying network address information in the IP header of packets while they are in transit across a traffic routing device.
19. proxy - forward proxy secures clients, reverse proxy secures servers
20. IP addressing, subnetting, VPC
    1. each IP address in IPv4 is 32 bits long - 4 bytes - 4 integers of 1 byte each separated by dots
    2. subnet - represents a network by having an IP prefix (a.b.c.d/24 means first 24 bits are fixed in the network, a.b.c is the constant)
    3. the a.b.c.d/x form of addressing is called as CIDR
    4. before CIDR, network prefixes were considered to be of fixed size 8-bit (class A), 16-bit (class B), 24-bit (class C) - classful addressing
    5. in every subnet, two addresses are reserved for special use. for a subnet range 192.168.1.0/24, the network address is 192.168.1.0. this address identifies the entire subnet. and the broadcast address is 192.168.1.255 and is like a loudspeaker that broadcasts messages to everyone in the neighborhood.
    6. a subnet mask is a 32-bit number created by setting host bits to all 0s and setting network bits to all 1s. performing a logical AND between the subnet mask and IP address gives the network address.
    7. VPC - a private cloud
21. VPN
    1. establish a secure connection b/w a computing device and a computer network or b/w two networks
    2. can extend access to a private network
    3. created by establishing a point-to-point connection through the use of tunneling protocols over existing networks
    4. components
        1. vpn client
        2. vpn server
        3. tunneling 
    5. seems like a glorified proxy
    6. they are helpful when you are connected to public wifi
    7. best way is to run your own VPN server
    8. openvpn is an open source VPN server
    9. wireguard is an open source VPN server and protocol
    10. tailscale seems pretty cool
22. BGP
    1. qn autonomous system (AS) is a collection of connected Internet Protocol (IP) routing prefixes under the control of one or more network operators on behalf of a single administrative entity or domain, that presents a common and clearly defined routing policy to the Internet.
    2. in simpler terms, an AS is a network or a group of networks managed by a single organization (like an internet service provider, a university, a large corporation, etc.) and has its own unique identification number called an Autonomous System Number (ASN).
    3. the Border Gateway Protocol was sketched out in 1989 by engineers on the back of "three ketchup-stained napkins", and is still known as the three-napkin protocol.
    4. in one way - BGP is what connects different ISPs in the world together.
