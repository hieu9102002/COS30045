# References:
# https://towardsdatascience.com/3-lines-of-python-code-to-write-a-web-server-46a109666dbf
# https://stackoverflow.com/questions/59908927/failed-to-load-module-script-the-server-responded-with-a-non-javascript-mime-ty

# Other references:
# https://www.w3schools.com/nodejs/nodejs_filesystem.asp
# https://www.digitalocean.com/community/tutorials/how-to-create-a-web-server-in-node-js-with-the-http-module
# https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
# https://stackoverflow.com/questions/58045415/tcpserver-vs-httpserver


import os
import http.server
import socketserver
import webbrowser

# Parameters

CHROME_PATH = 'C:/Program Files/Google/Chrome/Application/chrome.exe %s --incognito'
CHROME = webbrowser.get(CHROME_PATH)
OPEN_BROWSER = True
ASK_OPEN_BROWSER = True

HOST = "localhost"
PORT = 9000
DIRECTORY = "."
SERVERTYPE = "HTTP"

SERVERTYPES = [
    "HTTP",
    "TCP",
    "UDP"
]

SERVERCLASS = http.server.HTTPServer


# If user wants to customize

CUSTOM = False

if(CUSTOM):

    print(f"Current server type is: {SERVERTYPE}")
    print(f"Current server is: http://{HOST}:{PORT}")
    print(f"Current root directory is: {os.getcwd()}")

    change = input("Change server type? (y/n): ")
    if(change == "y" or change == "Y"):
        SERVERTYPE = input("New server type: ").upper()
        if(SERVERTYPE not in SERVERTYPES):
            print("Error: Server type", SERVERTYPE, "is not available")

    change = input("Change port? (y/n): ")
    if(change == "y" or change == "Y"):
        PORT = input("New Port: ")
        try:
            PORT = int(PORT)
            if(PORT not in range(0,65536)):
                print("Error: Port must be between 0 and 65536")
        except:
            print("Error: Port must be a number")
        

    change = input("Change directory? (y/n): ")
    if(change == "y" or change == "Y"):
        DIRECTORY = input("Root directory: ")
        if(not os.path.exists(DIRECTORY)):
            print("Error: Directory \"", DIRECTORY, "\" does not exist")
        else:
            os.chdir(DIRECTORY)

# print status
print(f"Server type is: {SERVERTYPE}")
print(f"Server is running on: http://{HOST}:{PORT}")
print(f"Root directory is: {os.getcwd()}")

# ask to open browser
if(OPEN_BROWSER):
    CHROME.open_new(f"http://{HOST}:{PORT}")

elif(ASK_OPEN_BROWSER):
    print(f"Open browser? (y/n) ")
    open_browser = input("Open browser? (y/n): ")
    if(open_browser == "y" or open_browser == "Y"):
        CHROME.open_new(f"http://{HOST}:{PORT}")

# Create handler
Handler = http.server.CGIHTTPRequestHandler

# Update handler for .js files
Handler.extensions_map.update({
    ".js": "application/javascript",
})

# Create server object listening the port
Server = SERVERCLASS(
    server_address=("", PORT),
    RequestHandlerClass=Handler
)

# Start the web server
Server.serve_forever()
