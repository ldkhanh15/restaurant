import 'dart:convert';
import 'dart:io';

void main() async {
  final ip = InternetAddress.loopbackIPv4;
  final port = 8080;

  final server = await HttpServer.bind(ip, port);
  print('Mock API server running on http://${ip.address}:$port');

  // In-memory data
  final menu = [
    {
      'id': 1,
      'name': 'Phở bò',
      'description': 'Phở bò truyền thống',
      'price': 80000,
      'image': 'https://via.placeholder.com/150'
    },
    {
      'id': 2,
      'name': 'Cà phê sữa đá',
      'description': 'Cà phê sữa đá thơm ngon',
      'price': 25000,
      'image': 'https://via.placeholder.com/150'
    },
  ];

  final tables = [
    {'id': 1, 'tableNumber': 1, 'capacity': 4, 'isOccupied': false, 'location': 'Tầng 1'},
    {'id': 2, 'tableNumber': 2, 'capacity': 2, 'isOccupied': true, 'location': 'Tầng 1'},
    {'id': 3, 'tableNumber': 3, 'capacity': 6, 'isOccupied': false, 'location': 'Tầng 2'},
  ];

  final reservations = <Map<String, dynamic>>[];

  await for (HttpRequest req in server) {
    final path = req.uri.path;
    final method = req.method;

    // Simple CORS
    req.response.headers.add('Access-Control-Allow-Origin', '*');
    req.response.headers.add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    req.response.headers.add('Access-Control-Allow-Headers', 'Content-Type');

    if (method == 'OPTIONS') {
      req.response.statusCode = HttpStatus.noContent;
      await req.response.close();
      continue;
    }

    try {
      if (path == '/menu' && method == 'GET') {
        req.response
          ..statusCode = HttpStatus.ok
          ..write(json.encode(menu));
      } else if (path == '/tables' && method == 'GET') {
        req.response
          ..statusCode = HttpStatus.ok
          ..write(json.encode(tables));
      } else if (path == '/reservations' && method == 'GET') {
        req.response
          ..statusCode = HttpStatus.ok
          ..write(json.encode(reservations));
      } else if (path == '/reservations' && method == 'POST') {
        final content = await utf8.decoder.bind(req).join();
        final data = json.decode(content) as Map<String, dynamic>;
        final id = reservations.length + 1;
        final created = {
          'id': id,
          ...data,
        };
        reservations.add(created);
        req.response
          ..statusCode = HttpStatus.created
          ..write(json.encode(created));
      } else {
        req.response
          ..statusCode = HttpStatus.notFound
          ..write(json.encode({'error': 'Not found'}));
      }
    } catch (e, st) {
      req.response
        ..statusCode = HttpStatus.internalServerError
        ..write(json.encode({'error': e.toString(), 'stack': st.toString()}));
    }

    await req.response.close();
  }
}
