const { EventEmitter } = require('events');

const msg = `Delivered-To: yapople@bk.ru
Return-path: <yapople@bk.ru>
Received: by f716.i.mail.ru with local (envelope-from <yapople@bk.ru>)
\tid 1kzuS3-0005LE-G4
\tfor yapople@bk.ru; Thu, 14 Jan 2021 07:41:39 +0300
Received: by e.mail.ru with HTTP;
\tThu, 14 Jan 2021 07:41:39 +0300
From: =?UTF-8?B?WWFwb3BsZSBZYXBvcGxl?= <yapople@bk.ru>
To: yapople@bk.ru
Subject: =?UTF-8?B?MTIz?=
MIME-Version: 1.0
X-Mailer: Mail.Ru Mailer 1.0
Date: Thu, 14 Jan 2021 07:41:39 +0300
Reply-To: =?UTF-8?B?WWFwb3BsZSBZYXBvcGxl?= <yapople@bk.ru>
X-Priority: 3 (Normal)
Message-ID: <1610599299.327620750@f716.i.mail.ru>
Content-Type: multipart/alternative;
\tboundary="--ALT--e2F8f5F19Ae0d3Ad5402B90c94Da42261610599299"
Authentication-Results: f716.i.mail.ru; auth=pass smtp.auth=yapople@bk.ru smtp.mailfrom=yapople@bk.ru
X-7564579A: B8F34718100C35BD
X-77F55803: 119C1F4DF6A9251CA00C606FC2A6EDA14938A8B9FD6EA06B2CE97A0A84B8E51E8FD872164937FA4C4DCFF97FFE73F8A48F18AF46A941B14497AE43B7D3F19652BE99519EE7714DF7
X-7FA49CB5: 70AAF3C13DB7016878DA827A17800CE73C0F88FA5C805B08D82A6BABE6F325AC08BE7437D75B48FABCF491FFA38154B613377AFFFEAFD269176DF2183F8FC7C0A3DED2DACB82E709C2099A533E45F2D0395957E7521B51C2CFCAF695D4D8E9FCEA1F7E6F0F101C6778DA827A17800CE7DBA72CFE7C57007CEA1F7E6F0F101C674E70A05D1297E1BBC6CDE5D1141D2B1CCC99F1D6E9E0E8D12A8A95B69805AEF7F363D3A223F587839FA2833FD35BB23D9E625A9149C048EE9ECD01F8117BC8BEA471835C12D1D9774AD6D5ED66289B52BA9C0B312567BB23117882F446042972877693876707352033AC447995A7AD182CC0D3CB04F14752D2E47CDBA5A96583BA9C0B312567BB23089D37D7C0E48F6CA18204E546F3947CB186746ED699346C5E1C53F199C2BB95C8A9BA7A39EFB7666BA297DBC24807EA089D37D7C0E48F6C8AA50765F7900637F0796DA527494C5DEFF80C71ABB335746BA297DBC24807EA27F269C8F02392CD94583DBE76202A583C9F3DD0FB1AF5EB4E70A05D1297E1BBCB5012B2E24CD356
X-C1DE0DAB: 0D63561A33F958A57A7EAE91BF9B3A3CF8F48F13FA85FE7F603C0ACC81CC0C35BDC6A1CF3F042BAD6DF99611D93F60EFB737A621A50BC793699F904B3F4130E343918A1A30D5E7FCCB5012B2E24CD356
X-C8649E89: 4E36BF7865823D7055A7F0CF078B5EC49A30900B95165D34AC6E62257D6CD1C925F2785FC6692B4CEC02DB1AB35283B85D57825E9594A06A81A8E5BF77A7195F1D7E09C32AA3244C00A95C4A133574C32B9D74C648FFF0137101BF96129E40113EB3F6AD6EA9203E
X-D57D3AED: 3ZO7eAau8CL7WIMRKs4sN3D3tLDjz0dLbV79QFUyzQ2Ujvy7cMT6pYYqY16iZVKkSc3dCLJ7zSJH7+u4VD18S7Vl4ZUrpaVfd2+vE6kuoey4m4VkSEu530nj6fImhcD4MUrOEAnl0W826KZ9Q+tr5+wYjsrrSY/u8Y3PrTqANeitKFiSd6Yd7yPpbiiZ/d5BsxIjK0jGQgCHUM3Ry2Lt2G3MDkMauH3h0dBdQGj+BB/iPzQYh7XS3xyn40EmMxrmzGyQ9/nTnF2pXKNLOEmKgjqYQ0PEDyTA
X-F696D7D5: TjfAjdIvod+Wb7zmDRFwdr3NlKWhUG2TLfer5l0vkJ1o8gXAjHNVhQ==
X-Mailru-Sender: B40868BCC58B981894F5FEF7359F6E118D28E9C659621C22E447BA82FF317FFDAE925CF1DC6893E233880C0EFABC5F6B3280C78E3A45B352DC76F73522076AE38668F41A5561F09FEFA6E27B07EBD43B60B36A8E39618E1E5E296935DF3C05750F9F2FCDE329DBC60D4ABDE8C577C2ED
X-Mras: Ok
X-Spam: undefined
X-Mailru-Intl-Transport: d,6db67b6


----ALT--e2F8f5F19Ae0d3Ad5402B90c94Da42261610599299
Content-Type: text/plain; charset=utf-8
Content-Transfer-Encoding: base64

CjEyMwoxMjMKLS0KWWFwb3BsZSBZYXBvcGxl
----ALT--e2F8f5F19Ae0d3Ad5402B90c94Da42261610599299
Content-Type: text/html; charset=utf-8
Content-Transfer-Encoding: base64

CjxIVE1MPjxCT0RZPjxkaXY+MTIzPC9kaXY+PGRpdj4xMjM8L2Rpdj48ZGl2IGRhdGEtc2lnbmF0
dXJlLXdpZGdldD0iY29udGFpbmVyIj48ZGl2IGRhdGEtc2lnbmF0dXJlLXdpZGdldD0iY29udGVu
dCI+PGRpdj4tLTxicj5ZYXBvcGxlIFlhcG9wbGU8L2Rpdj48L2Rpdj48L2Rpdj48L0JPRFk+PC9I
VE1MPgo=
----ALT--e2F8f5F19Ae0d3Ad5402B90c94Da42261610599299--
.` + '\r\n';

let messages = Array.from(new Array(4)).fill(msg);

class Socket extends EventEmitter {
    constructor() {
        super();
        setTimeout(() => {
            this.emit('data', Buffer.from('+OK\r\n'));
        }, 10);
    }
    write(data) {
        const message = data.toString();
        if (message.startsWith('USER')) {
            this.emit('data', Buffer.from('+OK \r\n'));
        } else if (message.startsWith('PASS')) {
            this.emit('data', Buffer.from('+OK Logged in.\r\n'));
        } else if (message.startsWith('QUIT')) {
            messages = messages.filter(m => m);
            this.emit('data', Buffer.from('+OK\r\n'));
        } else if (message.startsWith('STAT')) {
            this.emit('data', Buffer.from(`+OK ${messages.length} 13\r\n`));
        } else if (message.startsWith('LIST')) {
            if (message === 'LIST 1\r\n') {
                return this.emit('data', '+OK 1 86');
            }
            const response = [
                `+OK ${messages.length} messages (${messages.reduce((prev, cur) => prev + cur.length, 0)} octets)`,
                ...messages.map((message, i) => `${i + 1} ${JSON.stringify(message).length}`),
                '.'
            ].join('\r\n') + '\r\n';
            this.emit('data', Buffer.from(response));
        } else if (message.startsWith('RETR') || message.startsWith('TOP')) {
            const num = parseInt(message.startsWith('RETR') ? message.substring(5) : message.substring(4));
            if (messages[num - 1]) {
                this.emit('data', Buffer.from('+OK message follows\r\n'));
                this.emit('data', Buffer.from(messages[num - 1]));
            } else {
                this.emit('data', Buffer.from('-ERR invalid messages number\r\n'));
            }
        } else if (message.startsWith('DELE')) {
            const num = parseInt(message.substring(5));
            if (messages[num - 1]) {
                messages[num - 1] = null;
                this.emit('data', `+OK message ${num} deleted`);
            } else {
                this.emit('data', Buffer.from('-ERR invalid messages number\r\n'));
            }
        } else if (message.startsWith('RSET')) {
            messages = messages.map(() => msg);
            this.emit('data', '+OK');
        }
    }
    end() {
        setTimeout(() => {
            this.emit('end');
        }, 10);
    }
}

module.exports = {
    connect: () => {
        return new Socket();
    },
};
