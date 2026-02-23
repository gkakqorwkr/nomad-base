import struct

def get_image_info(path):
    with open(path, 'rb') as f:
        data = f.read(2)
        if data == b'\xff\xd8': # JPEG
            b = f.read(2)
            while b:
                length = struct.unpack('>H', f.read(2))[0]
                if b == b'\xff\xc0':
                    f.read(1)
                    h, w = struct.unpack('>HH', f.read(4))
                    return w, h
                f.seek(length-2, 1)
                b = f.read(2)
        elif data == b'\x89P': # PNG
            f.seek(16)
            w, h = struct.unpack('>II', f.read(8))
            return w, h
    return None

print(get_image_info('assets/background.png'))
