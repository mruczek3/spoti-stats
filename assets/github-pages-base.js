(function () {
    function basePath() {
        var host = location.hostname;
        var parts = location.pathname.split('/').filter(Boolean);
        if (host.endsWith('.github.io')) {
            if (parts.length && parts[0].indexOf('.') === -1) {
                return '/' + parts[0] + '/';
            }
            return '/';
        }
        var path = location.pathname.replace(/\/[^/]*$/, '');
        return (path || '.') + '/';
    }
    var base = document.createElement('base');
    base.href = basePath();
    document.head.appendChild(base);
})();
