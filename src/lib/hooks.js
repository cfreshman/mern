import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'
import { auth, addAuthTrigger, removeAuthTrigger } from './auth';
import { addIconTrigger, removeIconTrigger, setIcon, setManifest } from './util';
import api from './api';

// reference here: https://rangle.io/blog/simplifying-controlled-inputs-with-hooks/

export const useE = (...props) => {
    let func = props.pop()
    useEffect(() => func(), props)
}
export const useF = (...props) => {
    let func = props.pop()
    useEffect(() => { func() }, props)
}

export const useInput = (initialValue) => {
    const [value, setValue] = useState(initialValue);

    return {
        value,
        setValue,
        bind: {
            value,
            onChange: e => setValue(e.target.value)
        },
        reset: () => setValue(initialValue),
    };
};

export const useScript = (src) => {
    useE(src, () => {
        let script = document.createElement('script');
        script.src = src;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        }
    });
}

export const useTitle = (title) => {
    useE(title, () => {
        const prevTitle = document.title;
        document.title = title;
        return () => {
            if (document.title === title) {
                document.title = prevTitle;
            }
        }
    });
}
let description = document.querySelector('head [name=description]')
let descriptionDefault = description.content
export const useDescription = (desc) => {
    desc = desc || descriptionDefault
    useE(desc, () => {
        const prevDesc = description.content;
        description.content = desc;
        return () => {
            if (description.content === desc) {
                description.content = prevDesc;
            }
        }
    });
}

export const useLink = (href, rel) => {
    useE(href, rel, () => {
        let link = document.createElement('link');
        link.href = href;
        link.rel = rel;
        document.body.appendChild(link);
        return () => {
            document.body.removeChild(link);
        }
    });
}

export const useIcon = (href, app) => {
    useE(() => {
        setIcon(href, app);
        return () => {
            setIcon();
        }
    });
}

let manifest = document.querySelector('head [rel=manifest]')
const stringManifest = JSON.stringify({
    name: `freshman.dev`,
    display: `minimal-ui`,
    start_url: `${window.origin}`,
    icons: [{
        src: `${window.origin}/profile_full.png`,
        sizes: `595x595`,
        type: `image/png`
    }, {
        src: `${window.origin}/profile.png`,
        sizes: `256x256`,
        type: `image/png`
    }]
});
const blob = new Blob([stringManifest], {type: 'application/json'});
const defaultManifest = URL.createObjectURL(blob)
manifest.href = '' //defaultManifest
export const useManifest = (info) => {
    useE(() => {
        // from https://medium.com/@alshakero/how-to-setup-your-web-app-manifest-dynamically-using-javascript-f7fbee899a61
        setManifest(info)
        return () => {
            setManifest() //defaultManifest
        }
    });
}

export const cleanupId = (id, callback) => () => callback(id);

export const useTimeout = (callback, ms) =>
    useE(callback, ms, () => cleanupId(setTimeout(callback, ms), id => clearTimeout(id)));

export const useInterval = (callback, ms) =>
    useE(callback, ms, () => cleanupId(setInterval(callback, ms), id => clearInterval(id)));

export const useEventListener = (target, type, callback, useCapture) =>
    useE(target, type, callback, useCapture, () => cleanupId(
        type.split(' ').map(t => target.addEventListener(t, callback, useCapture)),
        () => type.split(' ').map(t => target.removeEventListener(t, callback, useCapture)),
    ));

export const useAnimate = (animate) =>
    useE(animate, () => {
        let id;
        const wrappedAnimate = (timestamp) => {
            id = requestAnimationFrame(wrappedAnimate);
            animate(timestamp);
        }
        wrappedAnimate(performance.now());
        return () => cancelAnimationFrame(id);
    });

export const useAuth = () => {
    const [localAuth, setLocalAuth] = useState(Object.assign({}, auth));
    useE(() => {
        let callback = auth => setLocalAuth(Object.assign({}, auth))
        addAuthTrigger(callback);
        return () => removeAuthTrigger(callback);
    });

    return localAuth;
}

export const useCheckin = (page) => {
    const auth = useAuth();
    const [done, setDone] = useState(false);

    useF(auth.user, () => {
        if (!done && auth.user) {
            api.post(`profile/checkin/${page}`).then(() => setDone(true));
        }
    });
}

export const useIconHref = () => {
    const [localHref, setLocalHref] =
        useState(document.querySelector('head [rel=icon]').href);
    useE(() => {
        let callback = href => setLocalHref(href)
        addIconTrigger(callback);
        return () => removeIconTrigger(callback);
    });
    return localHref;
}
